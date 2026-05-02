// apps/api-gateway/src/main.ts

import express from 'express';

export const app = express();
const port = process.env.PORT || 3333;

const MCP_BASE = 'https://mcp.jeffcrosley.com';

export function getGtdToken(): string | null {
  return process.env['GTD_AGENT_TOKEN'] ?? null;
}

export async function mcpCall(method: string, args: Record<string, unknown>): Promise<Response> {
  const token = getGtdToken();
  if (!token) throw new Error('GTD_AGENT_TOKEN not set');
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
  const token = getGtdToken();
  if (!token) {
    res.status(503).json({ error: 'GTD_AGENT_TOKEN not configured' });
    return;
  }
  try {
    const upstream = await fetch(`${MCP_BASE}/health`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await upstream.json();
    res.status(upstream.status).json({ reachable: upstream.ok, upstream: body });
  } catch {
    res.status(503).json({ reachable: false, error: 'MCP server unreachable' });
  }
});

// GET /api/gtd/tasks?status=in-progress — query MCP gtd_query_tasks
app.get('/api/gtd/tasks', async (req, res) => {
  const token = getGtdToken();
  if (!token) {
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
