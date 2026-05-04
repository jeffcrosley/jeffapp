import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

export const redisClient = createClient({ url: process.env.SESSION_REDIS_URL! });

export function buildSessionMiddleware() {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is required');
  if (!process.env.SESSION_REDIS_URL) throw new Error('SESSION_REDIS_URL is required');

  return session({
    store: new RedisStore({ client: redisClient as any, prefix: 'jeffapp:sess:' }),
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

export function requireSession(req: any, res: any, next: any) {
  if (!req.session?.user?.id || !req.session?.mcp?.accessToken) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

export async function getSessionMcpToken(req: any): Promise<string> {
  const mcp = req.session?.mcp;
  if (!mcp) throw new Error('No MCP token in session');

  const now = Date.now() / 1000;
  if (mcp.expiresAt - now > 60) return mcp.accessToken;

  const resp = await fetch(`${process.env.MCP_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: mcp.refreshToken,
      client_id: 'jeffapp',
      client_secret: process.env.GTD_AGENT_TOKEN!,
    }).toString(),
  });

  if (!resp.ok) {
    req.session.destroy(() => {});
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
