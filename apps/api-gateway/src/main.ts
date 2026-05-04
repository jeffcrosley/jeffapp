// apps/api-gateway/src/main.ts

import cors from 'cors';
import express from 'express';

export const app = express();
app.use(cors({ origin: 'https://jeffcrosley.com' }));
const port = process.env.PORT || 3333;

const MCP_BASE = 'https://mcp.jeffcrosley.com';
const MCP_ACCEPT = 'application/json, text/event-stream';

export function getGtdToken(): string | null {
  return process.env['GTD_AGENT_TOKEN'] ?? null;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let _tokenCache: TokenCache | null = null;
let _sessionCache: { sessionId: string } | null = null;

export function _resetTokenCache(): void {
  _tokenCache = null;
  _sessionCache = null;
}

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

async function getMcpSessionId(): Promise<string> {
  if (_sessionCache) return _sessionCache.sessionId;

  const token = await getAccessToken();
  const resp = await fetch(`${MCP_BASE}/mcp`, {
    method: 'POST',
    headers: {
      Accept: MCP_ACCEPT,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'jeffapp-api-gateway', version: '1.0.0' },
      },
    }),
  });

  if (!resp.ok) throw new Error(`MCP initialize failed: ${resp.status}`);

  const sessionId = resp.headers.get('mcp-session-id');
  if (!sessionId) throw new Error('MCP initialize did not return session ID');

  _sessionCache = { sessionId };
  return sessionId;
}

export async function mcpCall(method: string, args: Record<string, unknown>): Promise<Response> {
  const doCall = async (sessionId: string): Promise<Response> => {
    const token = await getAccessToken();
    return fetch(`${MCP_BASE}/mcp`, {
      method: 'POST',
      headers: {
        Accept: MCP_ACCEPT,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: method, arguments: args },
      }),
    });
  };

  const sessionId = await getMcpSessionId();
  const resp = await doCall(sessionId);

  if (resp.status === 404) {
    _sessionCache = null;
    return doCall(await getMcpSessionId());
  }

  return resp;
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'API Gateway' });
});

app.get('/api/gtd/health', async (req, res) => {
  if (!getGtdToken()) {
    res.status(503).json({ error: 'GTD_AGENT_TOKEN not configured' });
    return;
  }
  try {
    await getAccessToken();
    res.status(200).json({ reachable: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(503).json({ reachable: false, error: 'MCP server unreachable', detail });
  }
});

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
    const parsed = content
      ? (JSON.parse(content) as { tasks?: unknown[]; total?: number })
      : null;
    const tasks = parsed?.tasks ?? [];
    const total = parsed?.total ?? 0;
    res.status(200).json({ tasks, total });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: 'Failed to query tasks', detail });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`\n🚀 API Gateway is running on port ${port}`);
    console.log(`Access the health check at http://localhost:${port}/health`);
  });
}
