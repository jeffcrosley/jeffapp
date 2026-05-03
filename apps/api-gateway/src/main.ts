// apps/api-gateway/src/main.ts

import cors from 'cors';
import express from 'express';

export const app = express();
app.use(cors({ origin: 'https://jeffcrosley.com' }));
const port = process.env.PORT || 3333;

const MCP_BASE = 'https://mcp.jeffcrosley.com';

export function getGtdToken(): string | null {
  return process.env['GTD_AGENT_TOKEN'] ?? null;
}

// ── OAuth client_credentials token cache ─────────────────────────────────────

interface TokenCache {
  accessToken: string;
  expiresAt: number; // ms timestamp
}

let _tokenCache: TokenCache | null = null;

/** Reset the in-memory token cache. Exported for testing only. */
export function _resetTokenCache(): void {
  _tokenCache = null;
}

/**
 * Exchange GTD_AGENT_TOKEN for a proper OAuth access token using the
 * client_credentials grant. Caches the result and re-exchanges when
 * within 60 seconds of expiry.
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_tokenCache && _tokenCache.expiresAt - now > 60_000) {
    return _tokenCache.accessToken;
  }

  const agentToken = process.env['GTD_AGENT_TOKEN'];
  if (!agentToken) throw new Error('GTD_AGENT_TOKEN not set');

  const resp = await fetch(`${MCP_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=jeffapp&client_secret=${encodeURIComponent(agentToken)}`,
  });

  if (!resp.ok) {
    throw new Error(`Token exchange failed: ${resp.status}`);
  }

  const data = (await resp.json()) as { access_token: string; expires_in: number };
  _tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return _tokenCache.accessToken;
}

export async function mcpCall(method: string, args: Record<string, unknown>): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${MCP_BASE}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: method, arguments: args },
      id: 1,
    }),
  });
}

// --- Health Check ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'API Gateway' });
});

// --- GTD Routes ---

// GET /api/gtd/health — forward to mcp.jeffcrosley.com/health
app.get('/api/gtd/health', async (req, res) => {
  if (!getGtdToken()) {
    res.status(503).json({ error: 'GTD_AGENT_TOKEN not configured' });
    return;
  }
  try {
    const accessToken = await getAccessToken();
    const upstream = await fetch(`${MCP_BASE}/health`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await upstream.json();
    res.status(upstream.status).json({ reachable: upstream.ok, upstream: body });
  } catch {
    res.status(503).json({ reachable: false, error: 'MCP server unreachable' });
  }
});

// GET /api/gtd/tasks?status=in-progress — query MCP gtd_query_tasks
app.get('/api/gtd/tasks', async (req, res) => {
  if (!getGtdToken()) {
    res.status(503).json({ error: 'GTD_AGENT_TOKEN not configured' });
    return;
  }
  const status = (req.query['status'] as string) || 'in-progress';
  try {
    const upstream = await mcpCall('gtd_query_tasks', { limit: 50, offset: 0, status });
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'Upstream MCP error' });
      return;
    }
    const body = (await upstream.json()) as {
      result?: { content?: Array<{ text?: string }> };
    };
    const content = body?.result?.content?.[0]?.text;
    const tasks = content ? JSON.parse(content) : [];
    res.status(200).json({ tasks });
  } catch {
    res.status(502).json({ error: 'Failed to query tasks' });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`\n🚀 API Gateway is running on port ${port}`);
    console.log(`Access the health check at http://localhost:${port}/health`);
  });
}
