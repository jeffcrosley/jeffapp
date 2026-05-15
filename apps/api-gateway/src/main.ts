// apps/api-gateway/src/main.ts

import cors from 'cors';
import express from 'express';
import { redisClient, buildSessionMiddleware, requireSession, getSessionMcpToken } from './lib/session';
import { authRouter } from './lib/auth-routes';

export const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: 'https://jeffcrosley.com', credentials: true }));
app.use(buildSessionMiddleware());
app.use('/auth', express.json(), authRouter);
app.use('/api/gtd', requireSession);

const port = process.env.PORT || 3333;

const MCP_BASE = process.env.MCP_BASE_URL ?? 'https://mcp.jeffcrosley.com';
const MCP_ACCEPT = 'application/json, text/event-stream';

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

async function getMcpSessionId(token: string): Promise<string> {
  if (_sessionCache) return _sessionCache.sessionId;

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

export async function parseMcpResponse(resp: Response): Promise<unknown> {
  const ct = resp.headers.get('content-type') ?? '';
  if (ct.includes('text/event-stream')) {
    const text = await resp.text();
    for (const line of text.split('\n')) {
      if (line.startsWith('data:')) {
        return JSON.parse(line.slice(5).trim());
      }
    }
    throw new Error('No data line found in SSE response');
  }
  return resp.json();
}

async function mcpReadFile(path: string, token: string): Promise<string | null> {
  try {
    const resp = await mcpCall('fs_read_file', { path }, token);
    if (!resp.ok) return null;
    const body = (await parseMcpResponse(resp)) as {
      result?: { content?: Array<{ text?: string }> };
    };
    return body?.result?.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

function parseTaskIdsFromContent(content: string): string[] {
  const match = content.match(/[-*]\s*Task IDs?:\s*([^\n]+)/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map(id => id.trim())
    .filter(id => /^task_\d{8}_\d{3,}$/.test(id));
}

async function mcpGetTask(
  id: string,
  token: string
): Promise<{ id: string; title: string; status: string } | null> {
  try {
    const resp = await mcpCall('gtd_get_task', { id }, token);
    if (!resp.ok) return null;
    const body = (await parseMcpResponse(resp)) as {
      result?: { content?: Array<{ text?: string }> };
    };
    const text = body?.result?.content?.[0]?.text;
    if (!text) return null;
    const task = JSON.parse(text) as { id?: string; title?: string; status?: string };
    if (!task.id) return null;
    return { id: task.id, title: task.title ?? '', status: task.status ?? '' };
  } catch {
    return null;
  }
}

async function mcpFsList(path: string, token: string): Promise<string[]> {
  try {
    const resp = await mcpCall('fs_list_dir', { path }, token);
    if (!resp.ok) return [];
    const body = (await parseMcpResponse(resp)) as {
      result?: { content?: Array<{ text?: string }> };
    };
    const text = body?.result?.content?.[0]?.text;
    if (!text) return [];
    return text
      .split('\n')
      .filter(line => line.startsWith('FILE'))
      .map(line => line.replace(/^FILE\s+/, '').trim())
      .filter(name => name.length > 0);
  } catch {
    return [];
  }
}

export async function mcpCall(method: string, args: Record<string, unknown>, token: string): Promise<Response> {
  const doCall = async (sessionId: string): Promise<Response> => {
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

  const sessionId = await getMcpSessionId(token);
  const resp = await doCall(sessionId);

  if (resp.status === 404) {
    _sessionCache = null;
    return doCall(await getMcpSessionId(token));
  }

  return resp;
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'API Gateway' });
});

app.get('/api/gtd/health', async (req, res) => {
  try {
    await getSessionMcpToken(req);
    res.status(200).json({ reachable: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(503).json({ reachable: false, error: 'MCP server unreachable', detail });
  }
});

app.get('/api/gtd/tasks', async (req, res) => {
  const status = (req.query['status'] as string) || 'in-progress';
  try {
    const token = await getSessionMcpToken(req);
    const upstream = await mcpCall('gtd_query_tasks', { limit: 50, offset: 0, status }, token);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'Upstream MCP error' });
      return;
    }
    const body = (await parseMcpResponse(upstream)) as {
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

app.get('/api/gtd/tasks/recent', async (req, res) => {
  try {
    const token = await getSessionMcpToken(req);
    const upstream = await mcpCall('gtd_query_tasks', { limit: 100, offset: 0 }, token);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'Upstream MCP error' });
      return;
    }
    const body = (await parseMcpResponse(upstream)) as {
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
    res.status(502).json({ error: 'Failed to query recent tasks', detail });
  }
});

app.get('/api/gtd/briefs', async (req, res) => {
  try {
    const token = await getSessionMcpToken(req);
    const filenames = await mcpFsList('/home/jeffcrosley/Personal/GTD/briefs/', token);
    const mdFiles = filenames.filter(f => f.endsWith('.md') && !f.startsWith('archive/'));

    const briefs = await Promise.all(
      mdFiles.map(async filename => {
        const base = filename.replace(/\.md$/, '');
        const match = base.match(/^\d{4}-\d{2}-\d{2}-([^-]+)-(.+)$/);
        if (!match) return null;
        const [, agent, slug] = match;

        const content = await mcpReadFile(
          `/home/jeffcrosley/Personal/GTD/briefs/${filename}`,
          token
        );
        const taskIds = content ? parseTaskIdsFromContent(content) : [];

        const tasks = (
          await Promise.all(taskIds.map(id => mcpGetTask(id, token)))
        ).filter((t): t is NonNullable<typeof t> => t !== null);

        return { slug, filename, agent, tasks };
      })
    );

    res.status(200).json({
      briefs: briefs.filter((b): b is NonNullable<typeof b> => b !== null),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: 'Failed to query briefs', detail });
  }
});

if (require.main === module) {
  redisClient
    .connect()
    .then(() => {
      app.listen(port, () => {
        console.log(`\n🚀 API Gateway is running on port ${port}`);
        console.log(`Access the health check at http://localhost:${port}/health`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to Redis:', err);
      process.exit(1);
    });
}
