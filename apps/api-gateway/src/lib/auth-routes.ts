import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const MCP_BASE = process.env.MCP_BASE_URL ?? 'https://mcp.jeffcrosley.com';
export const loginRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

export const authRouter = Router();

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
      client_id: 'jeffapp',
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
    req.session.user = { id: 'jeff', loginAt: now };
    req.session.mcp = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? '',
      expiresAt: now + data.expires_in,
      issuedAt: now,
    };
    req.session.save((saveErr: unknown) => {
      if (saveErr) return res.status(500).json({ error: 'session_error' });
      res.status(200).json({ user: { id: 'jeff' } });
    });
  });
});

authRouter.get('/me', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'unauthorized' });
  res.status(200).json({ user: { id: userId } });
});

authRouter.post('/logout', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const token = req.session.mcp?.accessToken;
  if (token) {
    fetch(`${MCP_BASE}/token/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: 'jeffapp',
        client_secret: process.env['GTD_AGENT_TOKEN'] as string,
        token,
      }).toString(),
    }).catch(() => { /* best-effort revocation — ignore errors */ });
  }
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'session_error' });
    res.clearCookie('jeffapp.sid');
    res.status(200).json({ ok: true });
  });
});
