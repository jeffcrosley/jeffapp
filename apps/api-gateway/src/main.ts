// apps/api-gateway/src/main.ts

import cors from 'cors';
import express from 'express';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { redisClient, buildSessionMiddleware, requireSession } from './lib/session';
import { eventBusClient } from './lib/redis';
import { authRouter } from './lib/auth-routes';
import { statusRouter } from './lib/status-routes';
import { registerSseRoute } from './lib/sse';
import { publishEvent } from './lib/publish';

export const app = express();

app.set('trust proxy', 1);
app.use(cors({
  origin: ['https://jeffcrosley.com', 'http://localhost:4200'],
  credentials: true,
}));
app.use(buildSessionMiddleware());
app.use('/auth', express.json(), authRouter);
app.use('/api/status', express.json(), statusRouter);

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

// ─── SSE (must be before body-parsing middleware for this route) ───────────────
registerSseRoute(app);

// ─── R2 / dispatch ─────────────────────────────────────────────────────────────
function getR2Client(): S3Client {
  const accountId = process.env['R2_ACCOUNT_ID'];
  if (!accountId) throw new Error('R2_ACCOUNT_ID not set');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env['R2_ACCESS_KEY_ID'] ?? '',
      secretAccessKey: process.env['R2_SECRET_ACCESS_KEY'] ?? '',
    },
  });
}

const R2_BUCKET = process.env['R2_BUCKET'] ?? 'jeffcrosley-gtd';
const DISPATCH_PREFIX = 'factory/dispatches/';

app.get('/api/dispatches', requireSession, async (_req, res) => {
  try {
    const r2 = getR2Client();
    const list = await r2.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: DISPATCH_PREFIX })
    );

    const objects = list.Contents ?? [];
    const dispatches = await Promise.all(
      objects.map(async (obj) => {
        if (!obj.Key) return null;
        const data = await r2.send(
          new GetObjectCommand({ Bucket: R2_BUCKET, Key: obj.Key })
        );
        const text = await data.Body?.transformToString();
        if (!text) return null;
        return JSON.parse(text) as Record<string, unknown>;
      })
    );

    const sorted = dispatches
      .filter((d): d is Record<string, unknown> => d !== null)
      .sort((a, b) => {
        const ta = String(a['created_at'] ?? '');
        const tb = String(b['created_at'] ?? '');
        return tb.localeCompare(ta);
      })
      .slice(0, 20);

    res.json(sorted);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: 'Failed to list dispatches', detail });
  }
});

// ─── GTD helpers ───────────────────────────────────────────────────────────────

function extractMcpText(parsed: unknown): string {
  const p = parsed as { result?: { content?: Array<{ text?: string }> } };
  return p?.result?.content?.[0]?.text ?? '';
}

// ─── GET /api/gtd/work — open tasks grouped by project ────────────────────────
app.get('/api/gtd/work', requireSession, async (_req, res) => {
  try {
    const token = await getAccessToken();
    const resp = await mcpCall('gtd_query_tasks', { status: 'todo', limit: 100 }, token);
    if (!resp.ok) {
      res.status(502).json({ error: 'GTD query failed', detail: resp.status });
      return;
    }
    const parsed = await parseMcpResponse(resp);
    const text = extractMcpText(parsed);
    let rawTasks: unknown;
    try { rawTasks = JSON.parse(text); } catch { rawTasks = []; }
    const tasks = Array.isArray(rawTasks)
      ? rawTasks
      : ((rawTasks as { tasks?: unknown[] })?.tasks ?? []);

    const projectMap: Record<string, Array<Record<string, unknown>>> = {};
    const ungrouped: Array<Record<string, unknown>> = [];

    for (const t of tasks as Array<Record<string, unknown>>) {
      const project = t['project'] as string | undefined;
      const item = {
        id: t['id'] ?? '',
        title: t['title'] ?? '',
        claimed: t['claimed_by'] != null,
        context: t['context'],
        priority: t['priority'],
      };
      if (project) {
        if (!projectMap[project]) projectMap[project] = [];
        projectMap[project].push(item);
      } else {
        ungrouped.push(item);
      }
    }

    const projects = Object.entries(projectMap).map(([name, taskList]) => ({ name, tasks: taskList }));
    res.json({ projects, ungrouped });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: 'Failed to get work', detail });
  }
});

// ─── GET /api/gtd/inbox — read inbox items ────────────────────────────────────
app.get('/api/gtd/inbox', requireSession, async (_req, res) => {
  try {
    const token = await getAccessToken();
    const resp = await mcpCall('fs_read_file', { path: '/home/jeffcrosley/Personal/GTD/inbox.md' }, token);
    if (!resp.ok) {
      res.status(502).json({ error: 'Failed to read inbox', detail: resp.status });
      return;
    }
    const parsed = await parseMcpResponse(resp);
    const text = extractMcpText(parsed);
    const items = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    res.json({ items });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: 'Failed to read inbox', detail });
  }
});

// ─── POST /api/gtd/inbox — capture items to inbox ────────────────────────────
app.post('/api/gtd/inbox', requireSession, express.json(), async (req, res) => {
  try {
    const { text } = req.body as { text?: string };
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    const token = await getAccessToken();
    await Promise.all(
      lines.map((line: string) => mcpCall('gtd_inbox_capture', { title: line, source: 'jeffapp-dashboard' }, token))
    );
    res.json({ added: lines.length });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: 'Failed to capture inbox', detail });
  }
});

// ─── Internal webhook (dispatch worker → api-gateway → SSE) ───────────────────
app.post('/internal/dispatch-event', express.json(), (req, res) => {
  const token = req.headers['x-internal-token'];
  if (!process.env['JEFFAPP_INTERNAL_TOKEN'] || token !== process.env['JEFFAPP_INTERNAL_TOKEN']) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const { type, data } = req.body as { type?: string; data?: unknown };
  if (type) {
    publishEvent('jeff:dispatch', type, data).catch(() => {});
  }
  res.json({ ok: true });
});

if (require.main === module) {
  // Session Redis is REQUIRED — the gateway cannot serve authenticated requests without it.
  redisClient
    .connect()
    .then(() => {
      // Event bus Redis is OPTIONAL — SSE degrades gracefully if it is unavailable.
      // A failure here must never take down auth or the rest of the gateway.
      eventBusClient
        .connect()
        .catch((err) => {
          console.warn(
            'Event bus Redis unavailable — SSE disabled, gateway continuing:',
            err?.message ?? err,
          );
        });
      app.listen(port, () => {
        console.log(`\n🚀 API Gateway is running on port ${port}`);
        console.log(`Access the health check at http://localhost:${port}/health`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to session Redis:', err);
      process.exit(1);
    });
}
