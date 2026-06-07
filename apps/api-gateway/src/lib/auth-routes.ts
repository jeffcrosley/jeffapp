import { Router } from 'express';
import { randomBytes, createHash } from 'crypto';
import rateLimit from 'express-rate-limit';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { redisClient } from './session';

const MCP_BASE = process.env.MCP_BASE_URL ?? 'https://mcp.jeffcrosley.com';
const AUTHENTIK_ISSUER =
  process.env['AUTHENTIK_ISSUER'] ?? 'https://auth.jeffcrosley.com/application/o/jeffapp/';
const AUTHENTIK_JWKS_URI =
  process.env['AUTHENTIK_JWKS_URI'] ?? 'https://auth.jeffcrosley.com/application/o/jeffapp/jwks/';
const AUTHENTIK_CLIENT_ID = process.env['AUTHENTIK_CLIENT_ID'] ?? 'jeffapp';
const AUTHENTIK_CLIENT_SECRET = process.env['AUTHENTIK_CLIENT_SECRET'] as string;
// redirect_uri registered in Authentik — Angular /auth/callback receives the code and forwards to BFF
const AUTHENTIK_REDIRECT_URI =
  process.env['AUTHENTIK_REDIRECT_URI'] ?? 'https://jeffcrosley.com/auth/callback';
const APP_BASE_URL = process.env['APP_BASE_URL'] ?? 'https://jeffcrosley.com';

const jwks = createRemoteJWKSet(new URL(AUTHENTIK_JWKS_URI));

export const loginRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
export const authRouter = Router();

// GET /auth/login — initiate OIDC Authorization Code + PKCE flow
authRouter.get('/login', async (req, res) => {
  const codeVerifier = randomBytes(64).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const state = randomBytes(32).toString('base64url');
  const nonce = randomBytes(32).toString('hex');

  await redisClient.setEx(
    `jeffapp:pkce:${state}`,
    300,
    JSON.stringify({ code_verifier: codeVerifier, nonce, initiated_at: Date.now() })
  );

  const params = new URLSearchParams({
    client_id: AUTHENTIK_CLIENT_ID,
    response_type: 'code',
    redirect_uri: AUTHENTIK_REDIRECT_URI,
    scope: 'openid profile email groups offline_access',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(302, `${AUTHENTIK_ISSUER}authorize/?${params.toString()}`);
});

// GET /auth/callback — receive authorization code forwarded from Angular AuthCallbackComponent
authRouter.get('/callback', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(`${APP_BASE_URL}/auth/callback?error=auth_error`);
  }
  if (!code || !state) {
    return res.redirect(`${APP_BASE_URL}/auth/callback?error=missing_params`);
  }

  const pkceKey = `jeffapp:pkce:${state}`;
  const storedRaw = await redisClient.get(pkceKey);
  if (!storedRaw) {
    return res.redirect(`${APP_BASE_URL}/auth/callback?error=invalid_state`);
  }
  const stored = String(storedRaw);

  const { code_verifier: codeVerifier, nonce } = JSON.parse(stored) as {
    code_verifier: string;
    nonce: string;
  };
  await redisClient.del(pkceKey);

  const tokenResp = await fetch(`${AUTHENTIK_ISSUER}token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: AUTHENTIK_REDIRECT_URI,
      client_id: AUTHENTIK_CLIENT_ID,
      client_secret: AUTHENTIK_CLIENT_SECRET,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!tokenResp.ok) {
    console.error('[auth/callback] token exchange failed:', tokenResp.status, await tokenResp.text());
    return res.redirect(`${APP_BASE_URL}/auth/callback?error=token_exchange_failed`);
  }

  const tokens = (await tokenResp.json()) as {
    access_token: string;
    id_token: string;
    refresh_token: string;
    expires_in: number;
  };

  let idPayload: Record<string, unknown>;
  try {
    const { payload } = await jwtVerify(tokens.id_token, jwks, {
      issuer: AUTHENTIK_ISSUER,
      audience: AUTHENTIK_CLIENT_ID,
    });
    if (payload['nonce'] !== nonce) throw new Error('nonce mismatch');
    idPayload = payload as Record<string, unknown>;
  } catch (err) {
    console.error('[auth/callback] ID token validation failed:', err);
    return res.redirect(`${APP_BASE_URL}/auth/callback?error=invalid_id_token`);
  }

  const groups = (idPayload['groups'] as string[] | undefined) ?? [];
  let role: 'jeff_admin' | 'family_member' | null = null;
  if (groups.includes('jeffapp-admin')) role = 'jeff_admin';
  else if (groups.includes('jeffapp-family')) role = 'family_member';

  if (!role) {
    return res.redirect(`${APP_BASE_URL}/auth/callback?error=access_denied`);
  }

  const now = Date.now() / 1000;
  const sessionUser = {
    id: idPayload['sub'] as string,
    email: (idPayload['email'] as string) ?? '',
    name: (idPayload['name'] as string) ?? '',
    role,
    groups,
    loginAt: now,
  };

  const oidcData = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? '',
    idToken: tokens.id_token,
    expiresAt: now + tokens.expires_in,
    issuedAt: now,
  };

  // For jeff_admin, also get MCP token so GTD endpoints continue to work
  let mcpData: { accessToken: string; refreshToken: string; expiresAt: number; issuedAt: number } | undefined;
  if (role === 'jeff_admin') {
    try {
      const mcpResp = await fetch(`${MCP_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: AUTHENTIK_CLIENT_ID,
          client_secret: process.env['GTD_AGENT_TOKEN'] as string,
        }).toString(),
      });
      if (mcpResp.ok) {
        const d = (await mcpResp.json()) as { access_token: string; refresh_token?: string; expires_in: number };
        mcpData = {
          accessToken: d.access_token,
          refreshToken: d.refresh_token ?? '',
          expiresAt: now + d.expires_in,
          issuedAt: now,
        };
      } else {
        console.warn('[auth/callback] MCP token fetch failed — GTD will be unavailable this session');
      }
    } catch (err) {
      console.warn('[auth/callback] MCP token fetch error:', err);
    }
  }

  req.session.regenerate((err) => {
    if (err) return res.redirect(`${APP_BASE_URL}/auth/callback?error=session_error`);
    req.session.user = sessionUser;
    req.session.oidc = oidcData;
    if (mcpData) req.session.mcp = mcpData;
    req.session.save((saveErr) => {
      if (saveErr) return res.redirect(`${APP_BASE_URL}/auth/callback?error=session_error`);
      res.redirect(APP_BASE_URL);
    });
  });
});

// POST /auth/login — legacy password grant (kept alongside OIDC, not yet removed)
authRouter.post('/login', loginRateLimiter, async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const resp = await fetch(`${MCP_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: AUTHENTIK_CLIENT_ID,
      client_secret: process.env['GTD_AGENT_TOKEN'] as string,
      username,
      password,
    }).toString(),
  });

  if (resp.status === 429) return res.status(429).json({ error: 'rate_limited' });
  if (!resp.ok) return res.status(401).json({ error: 'invalid_credentials' });

  const data = (await resp.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  const now = Date.now() / 1000;

  req.session.regenerate((err: unknown) => {
    if (err) return res.status(500).json({ error: 'session_error' });
    req.session.user = { id: username, loginAt: now };
    req.session.mcp = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? '',
      expiresAt: now + data.expires_in,
      issuedAt: now,
    };
    req.session.save((saveErr: unknown) => {
      if (saveErr) return res.status(500).json({ error: 'session_error' });
      res.status(200).json({ user: { id: username } });
    });
  });
});

authRouter.get('/me', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const user = req.session.user;
  if (!user?.id) return res.status(401).json({ error: 'unauthorized' });
  res.status(200).json({ user: { id: user.id } });
});

authRouter.post('/logout', async (req, res) => {
  res.set('Cache-Control', 'no-store');

  // Best-effort MCP token revocation
  const mcpToken = req.session.mcp?.accessToken;
  if (mcpToken) {
    fetch(`${MCP_BASE}/token/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: AUTHENTIK_CLIENT_ID,
        client_secret: process.env['GTD_AGENT_TOKEN'] as string,
        token: mcpToken,
      }).toString(),
    }).catch(() => { /* best-effort */ });
  }

  // Build Authentik end-session URL if we have an OIDC id_token
  const idToken = req.session.oidc?.idToken;
  const endSessionUrl = idToken
    ? `${AUTHENTIK_ISSUER}end-session/?id_token_hint=${encodeURIComponent(idToken)}&post_logout_redirect_uri=${encodeURIComponent(APP_BASE_URL)}`
    : null;

  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'session_error' });
    res.clearCookie('jeffapp.sid');
    res.status(200).json({ ok: true, ...(endSessionUrl && { endSessionUrl }) });
  });
});
