import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email?: string;
      name?: string;
      role?: 'jeff_admin' | 'family_member';
      groups?: string[];
      loginAt: number;
    };
    oidc?: {
      accessToken: string;
      refreshToken: string;
      idToken: string;
      expiresAt: number;
      issuedAt: number;
    };
    mcp?: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      issuedAt: number;
    };
  }
}

export const redisClient = createClient({ url: process.env['SESSION_REDIS_URL'] as string });

export function buildSessionMiddleware() {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is required');
  if (!process.env.SESSION_REDIS_URL) throw new Error('SESSION_REDIS_URL is required');

  return session({
    store: new RedisStore({ client: redisClient as never, prefix: 'jeffapp:sess:' }),
    secret: process.env.SESSION_SECRET,
    name: 'jeffapp.sid',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    },
  });
}

export function requireSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

export async function getSessionMcpToken(req: Request): Promise<string> {
  const mcp = req.session.mcp;
  if (!mcp) throw new Error('No MCP token in session');

  const now = Date.now() / 1000;
  if (mcp.expiresAt - now > 60) return mcp.accessToken;

  const MCP_BASE_URL = process.env.MCP_BASE_URL ?? 'https://mcp.jeffcrosley.com';
  const GTD_AGENT_TOKEN = process.env['GTD_AGENT_TOKEN'] as string;

  // OIDC sessions store no refresh token — use client_credentials to renew
  const grantBody = mcp.refreshToken
    ? new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: mcp.refreshToken,
        client_id: 'jeffapp',
        client_secret: GTD_AGENT_TOKEN,
      })
    : new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'jeffapp',
        client_secret: GTD_AGENT_TOKEN,
      });

  const resp = await fetch(`${MCP_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: grantBody.toString(),
  });

  if (!resp.ok) {
    req.session.destroy(() => { /* fire-and-forget destroy on refresh failure */ });
    throw new Error('Session expired — refresh failed');
  }

  const data = (await resp.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  req.session.mcp = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? mcp.refreshToken,
    expiresAt: now + data.expires_in,
    issuedAt: now,
  };
  return data.access_token;
}
