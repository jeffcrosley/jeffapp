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
import { MR_CONFIG, MREntry } from './mrs-config';

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

// ─── Sessions (AI Workshop) ────────────────────────────────────────────────────

interface DispatchRecord {
  dispatch_id: string;
  agent?: string;
  model?: string;
  account?: string;
  status?: string;
  session_name?: string;
  created_at?: string;
  claimed_at?: string;
  completed_at?: string;
  brief_path?: string;
  return_doc_path?: string;
  signal_sent?: boolean;
  tokens_in?: number | null;
  tokens_out?: number | null;
  cost_usd?: number | null;
  cost_estimated?: boolean;
}

async function fetchAllDispatchRecords(): Promise<DispatchRecord[]> {
  const r2 = getR2Client();
  const list = await r2.send(
    new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: DISPATCH_PREFIX })
  );
  const objects = list.Contents ?? [];
  const records = await Promise.all(
    objects.map(async (obj) => {
      if (!obj.Key) return null;
      const data = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: obj.Key }));
      const text = await data.Body?.transformToString();
      if (!text) return null;
      return JSON.parse(text) as DispatchRecord;
    })
  );
  return records.filter((r): r is DispatchRecord => r !== null);
}

function toSession(d: DispatchRecord): Record<string, unknown> {
  let duration_seconds: number | null = null;
  if (d.claimed_at && d.completed_at) {
    const diff = new Date(d.completed_at).getTime() - new Date(d.claimed_at).getTime();
    if (!isNaN(diff) && diff >= 0) duration_seconds = Math.round(diff / 1000);
  }

  let brief_name: string | undefined;
  if (d.brief_path) {
    const filename = d.brief_path.split('/').pop() ?? '';
    brief_name = filename.replace(/-brief\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  }

  return {
    dispatch_id: d.dispatch_id,
    agent: d.agent,
    model: d.model,
    account: d.account,
    status: d.status,
    session_name: d.session_name,
    created_at: d.created_at,
    completed_at: d.completed_at,
    brief_path: d.brief_path,
    brief_name,
    return_doc_path: d.return_doc_path,
    duration_seconds,
    tokens_in: d.tokens_in ?? null,
    tokens_out: d.tokens_out ?? null,
    cost_usd: d.cost_usd ?? null,
    cost_estimated: d.cost_estimated ?? false,
    signal_sent: d.signal_sent,
  };
}

app.get('/api/sessions/summary', requireSession, async (_req, res) => {
  try {
    const records = await fetchAllDispatchRecords();

    const by_status: Record<string, number> = {};
    const by_agent: Record<string, number> = {};
    const by_model: Record<string, number> = {};
    const by_account: Record<string, number> = {};
    let total_cost_usd = 0;
    let total_tokens_in = 0;
    let total_tokens_out = 0;
    let cost_is_estimated = false;

    for (const r of records) {
      if (r.status) by_status[r.status] = (by_status[r.status] ?? 0) + 1;
      if (r.agent) by_agent[r.agent] = (by_agent[r.agent] ?? 0) + 1;
      if (r.model) by_model[r.model] = (by_model[r.model] ?? 0) + 1;
      if (r.account) by_account[r.account] = (by_account[r.account] ?? 0) + 1;
      if (typeof r.cost_usd === 'number') total_cost_usd += r.cost_usd;
      if (typeof r.tokens_in === 'number') total_tokens_in += r.tokens_in;
      if (typeof r.tokens_out === 'number') total_tokens_out += r.tokens_out;
      if (r.cost_estimated) cost_is_estimated = true;
    }

    res.json({
      total_sessions: records.length,
      by_status,
      by_agent,
      by_model,
      by_account,
      total_cost_usd,
      total_tokens_in,
      total_tokens_out,
      cost_is_estimated,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: 'Failed to compute session summary', detail });
  }
});

app.get('/api/sessions', requireSession, async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query['limit'] ?? '200'), 10) || 200, 1000);
    const filterStatus = req.query['status'] as string | undefined;
    const filterAgent = req.query['agent'] as string | undefined;
    const filterAccount = req.query['account'] as string | undefined;
    const filterModel = req.query['model'] as string | undefined;

    let records = await fetchAllDispatchRecords();

    if (filterStatus) records = records.filter((r) => r.status === filterStatus);
    if (filterAgent) records = records.filter((r) => r.agent === filterAgent);
    if (filterAccount) records = records.filter((r) => r.account === filterAccount);
    if (filterModel) records = records.filter((r) => r.model === filterModel);

    const sessions = records
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .slice(0, limit)
      .map(toSession);

    res.json({ sessions });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: 'Failed to list sessions', detail });
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
    const mcpTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('MCP timeout')), 5_000)
    );
    const resp = await Promise.race([
      mcpCall('gtd_query_tasks', { status: 'todo', limit: 100 }, token),
      mcpTimeout,
    ]);
    if (!resp.ok) {
      res.json({ projects: [], ungrouped: [], error: 'unavailable' });
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
  } catch {
    res.json({ projects: [], ungrouped: [], error: 'unavailable' });
  }
});

// ─── GET /api/gtd/inbox — read inbox items ────────────────────────────────────
app.get('/api/gtd/inbox', requireSession, async (_req, res) => {
  try {
    const token = await getAccessToken();
    const resp = await mcpCall('fs_read_file', { path: '/home/jeffcrosley/Personal/GTD/inbox.md' }, token);
    if (!resp.ok) {
      res.json({ items: [], error: 'unavailable' });
      return;
    }
    const parsed = await parseMcpResponse(resp);
    const text = extractMcpText(parsed);
    const items = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    res.json({ items });
  } catch {
    res.json({ items: [], error: 'unavailable' });
  }
});

// ─── MR Status Widget ─────────────────────────────────────────────────────────

interface MRWithStatus extends MREntry {
  status: 'draft' | 'open' | 'merged' | 'closed';
  pipeline_status?: 'passing' | 'failing' | 'pending';
}

interface MRStatusCache {
  data: MRWithStatus[];
  expiresAt: number;
}

let mrStatusCache: MRStatusCache | null = null;
const MR_CACHE_TTL = 60_000;

const GL_HOST = process.env['GITLAB_HOST'] ?? 'https://gitlab.com';

async function fetchGithubMRStatus(entry: MREntry, token: string): Promise<MRWithStatus> {
  const resp = await fetch(`https://api.github.com/repos/${entry.repo}/pulls/${entry.number}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!resp.ok) return { ...entry, status: 'open' };
  const pr = await resp.json() as Record<string, unknown>;

  let status: MRWithStatus['status'];
  if (pr['draft']) {
    status = 'draft';
  } else if (pr['state'] === 'closed') {
    status = pr['merged_at'] ? 'merged' : 'closed';
  } else {
    status = 'open';
  }

  let pipeline_status: MRWithStatus['pipeline_status'];
  const sha = (pr['head'] as Record<string, unknown> | null)?.['sha'] as string | undefined;
  if (sha) {
    const statusResp = await fetch(
      `https://api.github.com/repos/${entry.repo}/commits/${sha}/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    if (statusResp.ok) {
      const sd = await statusResp.json() as Record<string, unknown>;
      const state = sd['state'] as string | undefined;
      if (state === 'success') pipeline_status = 'passing';
      else if (state === 'failure' || state === 'error') pipeline_status = 'failing';
      else if (state === 'pending') pipeline_status = 'pending';
    }
  }

  return { ...entry, status, ...(pipeline_status ? { pipeline_status } : {}) };
}

async function fetchGitlabMRStatus(entry: MREntry, token: string): Promise<MRWithStatus> {
  const encoded = encodeURIComponent(entry.repo);
  const resp = await fetch(
    `${GL_HOST}/api/v4/projects/${encoded}/merge_requests/${entry.number}`,
    { headers: { 'PRIVATE-TOKEN': token } }
  );
  if (!resp.ok) return { ...entry, status: 'open' };
  const mr = await resp.json() as Record<string, unknown>;

  const mrState = mr['state'] as string;
  let status: MRWithStatus['status'];
  if (mrState === 'merged') {
    status = 'merged';
  } else if (mrState === 'closed') {
    status = 'closed';
  } else if (
    mr['work_in_progress'] ||
    (typeof mr['title'] === 'string' && /^draft:/i.test(mr['title']))
  ) {
    status = 'draft';
  } else {
    status = 'open';
  }

  let pipeline_status: MRWithStatus['pipeline_status'];
  const pipeline = mr['head_pipeline'] as Record<string, unknown> | null | undefined;
  if (pipeline) {
    const pstate = pipeline['status'] as string | undefined;
    if (pstate === 'success') pipeline_status = 'passing';
    else if (pstate === 'failed' || pstate === 'canceled') pipeline_status = 'failing';
    else if (pstate && ['pending', 'running', 'created', 'preparing', 'waiting_for_resource'].includes(pstate)) {
      pipeline_status = 'pending';
    }
  }

  return { ...entry, status, ...(pipeline_status ? { pipeline_status } : {}) };
}

app.get('/api/mrs', requireSession, async (_req, res) => {
  const now = Date.now();
  if (mrStatusCache && mrStatusCache.expiresAt > now) {
    res.json({ mrs: mrStatusCache.data });
    return;
  }

  const ghToken = process.env['GITHUB_TOKEN'];
  const glToken = process.env['GITLAB_TOKEN'];

  if (!ghToken && !glToken) {
    res.json({ mrs: [], unavailable: true });
    return;
  }

  const results = await Promise.all(
    MR_CONFIG.map(async (entry) => {
      try {
        if (entry.platform === 'github') {
          return ghToken ? fetchGithubMRStatus(entry, ghToken) : null;
        } else {
          return glToken ? fetchGitlabMRStatus(entry, glToken) : null;
        }
      } catch {
        return { ...entry, status: 'open' as const };
      }
    })
  );

  const mrs = results.filter((r): r is MRWithStatus => r !== null);
  mrStatusCache = { data: mrs, expiresAt: now + MR_CACHE_TTL };
  res.json({ mrs });
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
    publishEvent('jeff:dispatch', type, data).catch(() => void 0);
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
