import http from 'http';

// Mock session module — use no-op middleware and a mock getSessionMcpToken for GTD route tests
jest.mock('./lib/session', () => ({
  redisClient: { connect: jest.fn() },
  buildSessionMiddleware: () => (_req: any, _res: any, next: any) => next(),
  requireSession: (_req: any, _res: any, next: any) => next(),
  getSessionMcpToken: jest.fn().mockResolvedValue('mock-session-token'),
}));

import { app, _resetTokenCache, getAccessToken, parseMcpResponse } from './main';

type AddressInfo = { port: number };

function startServer(): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, port });
    });
  });
}

function stopServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

function httpGet(
  port: number,
  path: string,
  options: { headers?: Record<string, string> } = {}
): Promise<{ status: number; body: unknown; headers: Record<string, string | string[]> }> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: 'localhost', port, path, headers: options.headers ?? {} },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode ?? 0,
              body: JSON.parse(raw),
              headers: res.headers as Record<string, string | string[]>,
            });
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
  });
}

function httpOptions(
  port: number,
  path: string,
  headers: Record<string, string>
): Promise<{ status: number; headers: Record<string, string | string[]> }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { method: 'OPTIONS', hostname: 'localhost', port, path, headers },
      (res) => {
        res.resume();
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers as Record<string, string | string[]>,
          })
        );
      }
    );
    req.on('error', reject);
    req.end();
  });
}

const SESSION_ID = 'test-session-id';

const INIT_RESPONSE = {
  ok: true,
  status: 200,
  headers: { get: (name: string) => (name === 'mcp-session-id' ? SESSION_ID : null) },
  json: async () => ({}),
};

function mockFetchForMcpCall(...upstreamResponses: object[]): jest.Mock {
  const mock = jest.fn() as jest.Mock;
  mock.mockResolvedValueOnce(INIT_RESPONSE);
  for (const r of upstreamResponses) {
    mock.mockResolvedValueOnce(r);
  }
  return mock;
}

describe('api-gateway', () => {
  let server: http.Server;
  let port: number;
  let originalFetch: typeof global.fetch;

  beforeEach(async () => {
    originalFetch = global.fetch;
    _resetTokenCache();
    ({ server, port } = await startServer());
  });

  afterEach(async () => {
    delete process.env['GTD_AGENT_TOKEN'];
    global.fetch = originalFetch;
    _resetTokenCache();
    await stopServer(server);
  });

  describe('GET /health', () => {
    it('returns 200 with service info', async () => {
      const { status, body } = await httpGet(port, '/health');
      expect(status).toBe(200);
      expect(body).toMatchObject({ status: 'healthy', service: 'API Gateway' });
    });
  });

  describe('GET /api/gtd/health', () => {
    it('returns reachable:true when session token is available', async () => {
      const { status, body } = await httpGet(port, '/api/gtd/health');
      expect(status).toBe(200);
      expect((body as { reachable: boolean }).reachable).toBe(true);
    });
  });

  describe('GET /api/gtd/tasks', () => {
    it('returns tasks array and total from MCP JSON response', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Write tests',
          project: 'jeffapp',
          status: 'in-progress',
          updated_at: new Date().toISOString(),
        },
      ];
      global.fetch = mockFetchForMcpCall({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          result: { content: [{ text: JSON.stringify({ tasks: mockTasks, total: 1 }) }] },
        }),
      });

      const { status, body } = await httpGet(port, '/api/gtd/tasks?status=in-progress');
      expect(status).toBe(200);
      expect((body as { tasks: unknown[] }).tasks).toEqual(mockTasks);
      expect((body as { total: number }).total).toBe(1);
    });

    it('returns tasks array and total from MCP SSE response', async () => {
      const mockTasks = [{ id: '2', title: 'SSE task', status: 'in-progress' }];
      const ssePayload = `event: message\ndata: ${JSON.stringify({ result: { content: [{ text: JSON.stringify({ tasks: mockTasks, total: 1 }) }] } })}\n\n`;
      global.fetch = mockFetchForMcpCall({
        ok: true,
        status: 200,
        headers: { get: () => 'text/event-stream' },
        text: async () => ssePayload,
      });

      const { status, body } = await httpGet(port, '/api/gtd/tasks?status=in-progress');
      expect(status).toBe(200);
      expect((body as { tasks: unknown[] }).tasks).toEqual(mockTasks);
      expect((body as { total: number }).total).toBe(1);
    });

    it('returns empty tasks and zero total when MCP content is missing', async () => {
      global.fetch = mockFetchForMcpCall({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ result: {} }),
      });

      const { status, body } = await httpGet(port, '/api/gtd/tasks');
      expect(status).toBe(200);
      expect((body as { tasks: unknown[] }).tasks).toEqual([]);
      expect((body as { total: number }).total).toBe(0);
    });

    it('returns 502 when MCP call throws', async () => {
      global.fetch = jest.fn() as jest.Mock;
      (global.fetch as jest.Mock).mockResolvedValueOnce(INIT_RESPONSE);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

      const { status } = await httpGet(port, '/api/gtd/tasks');
      expect(status).toBe(502);
    });

    it('includes error detail in 502 response', async () => {
      global.fetch = jest.fn() as jest.Mock;
      (global.fetch as jest.Mock).mockResolvedValueOnce(INIT_RESPONSE);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('MCP initialize failed: 406'));

      const { status, body } = await httpGet(port, '/api/gtd/tasks');
      expect(status).toBe(502);
      expect((body as { detail: string }).detail).toMatch(/406/);
    });
  });

  describe('GET /api/gtd/tasks/recent', () => {
    it('returns tasks across all statuses from MCP JSON response', async () => {
      const mockTasks = [
        { id: '1', title: 'In-progress task', status: 'in-progress', updated_at: new Date().toISOString() },
        { id: '2', title: 'Done task', status: 'done', updated_at: new Date().toISOString() },
      ];
      global.fetch = mockFetchForMcpCall({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          result: { content: [{ text: JSON.stringify({ tasks: mockTasks, total: 2 }) }] },
        }),
      });

      const { status, body } = await httpGet(port, '/api/gtd/tasks/recent');
      expect(status).toBe(200);
      expect((body as { tasks: unknown[] }).tasks).toEqual(mockTasks);
      expect((body as { total: number }).total).toBe(2);
    });

    it('calls MCP with limit 100 and no status filter', async () => {
      const mockFetch = mockFetchForMcpCall({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ result: { content: [{ text: JSON.stringify({ tasks: [], total: 0 }) }] } }),
      });
      global.fetch = mockFetch;

      await httpGet(port, '/api/gtd/tasks/recent');

      // Call index 1 is the MCP tools/call (after INIT_RESPONSE at index 0)
      const toolCall = mockFetch.mock.calls[1];
      const body = JSON.parse(toolCall[1].body as string) as { params: { arguments: Record<string, unknown> } };
      expect(body.params.arguments['limit']).toBe(100);
      expect(body.params.arguments['status']).toBeUndefined();
    });
  });

  describe('GET /api/gtd/briefs', () => {
    it('returns correct brief shape with tasks cross-referenced', async () => {
      const mockTasks = [
        { id: 't1', title: 'Task 1', project: 'jeffapp', notes: '2026-05-04-saturn-aia-e2e-day1.md', claimed_by: 'saturn' },
      ];
      const mockFilenames = ['2026-05-04-saturn-aia-e2e-day1.md', '2026-05-04-mercury-dashboard.md'];

      const mockFetch = jest.fn() as jest.Mock;
      mockFetch.mockResolvedValueOnce(INIT_RESPONSE);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          result: { content: [{ text: JSON.stringify({ tasks: mockTasks, total: 1 }) }] },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          result: { content: [{ text: mockFilenames.map((f: string) => `FILE  ${f}`).join('\n') }] },
        }),
      });
      global.fetch = mockFetch;

      const { status, body } = await httpGet(port, '/api/gtd/briefs');
      expect(status).toBe(200);
      const b = body as { briefs: Array<{ slug: string; filename: string; agent: string; tasks: unknown[] }> };
      expect(b.briefs).toHaveLength(2);
      expect(b.briefs[0].slug).toBe('aia-e2e-day1');
      expect(b.briefs[0].agent).toBe('saturn');
      expect(b.briefs[0].tasks).toHaveLength(1);
      expect(b.briefs[1].slug).toBe('dashboard');
      expect(b.briefs[1].agent).toBe('mercury');
      expect(b.briefs[1].tasks).toHaveLength(0);
    });

    it('returns { briefs: [] } when fs_list_dir returns no .md files', async () => {
      const mockFetch = jest.fn() as jest.Mock;
      mockFetch.mockResolvedValueOnce(INIT_RESPONSE);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ result: { content: [{ text: JSON.stringify({ tasks: [], total: 0 }) }] } }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          result: { content: [{ text: 'DIR  archive' }] },
        }),
      });
      global.fetch = mockFetch;

      const { status, body } = await httpGet(port, '/api/gtd/briefs');
      expect(status).toBe(200);
      expect((body as { briefs: unknown[] }).briefs).toEqual([]);
    });

    it('returns { briefs: [] } with 200 when fs_list_dir call fails', async () => {
      const mockFetch = jest.fn() as jest.Mock;
      mockFetch.mockResolvedValueOnce(INIT_RESPONSE);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ result: { content: [{ text: JSON.stringify({ tasks: [], total: 0 }) }] } }),
      });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
      global.fetch = mockFetch;

      const { status, body } = await httpGet(port, '/api/gtd/briefs');
      expect(status).toBe(200);
      expect((body as { briefs: unknown[] }).briefs).toEqual([]);
    });
  });

  describe('Accept header', () => {
    const jsonMcpResponse = {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ result: { content: [{ text: JSON.stringify({ tasks: [], total: 0 }) }] } }),
    };

    it('sends Accept header on MCP initialize call', async () => {
      const mockFetch = mockFetchForMcpCall(jsonMcpResponse);
      global.fetch = mockFetch;

      await httpGet(port, '/api/gtd/tasks');

      const initCall = mockFetch.mock.calls[0];
      expect(initCall[1].headers['Accept']).toBe('application/json, text/event-stream');
    });

    it('sends Accept header on MCP tools/call', async () => {
      const mockFetch = mockFetchForMcpCall(jsonMcpResponse);
      global.fetch = mockFetch;

      await httpGet(port, '/api/gtd/tasks');

      const toolCall = mockFetch.mock.calls[1];
      expect(toolCall[1].headers['Accept']).toBe('application/json, text/event-stream');
    });
  });

  describe('token cache (getAccessToken)', () => {
    it('re-uses cached token when not near expiry', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'cached-token', expires_in: 3600 }),
      }) as jest.Mock;
      global.fetch = mockFetch;

      await getAccessToken();
      await getAccessToken();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('re-exchanges when cached token is within 60s of expiry', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'fresh-token', expires_in: 30 }),
      }) as jest.Mock;
      global.fetch = mockFetch;

      await getAccessToken();
      await getAccessToken();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('throws when GTD_AGENT_TOKEN is not set', async () => {
      delete process.env['GTD_AGENT_TOKEN'];
      await expect(getAccessToken()).rejects.toThrow('GTD_AGENT_TOKEN not set');
    });

    it('throws when token exchange returns non-OK', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      }) as jest.Mock;

      await expect(getAccessToken()).rejects.toThrow('Token exchange failed: 401');
    });
  });

  describe('parseMcpResponse', () => {
    const makeResp = (body: string, contentType: string) =>
      ({
        headers: { get: (h: string) => (h === 'content-type' ? contentType : null) },
        text: async () => body,
        json: async () => JSON.parse(body),
      }) as unknown as Response;

    it('parses plain JSON response', async () => {
      const payload = { result: { content: [{ text: 'hi' }] } };
      const resp = makeResp(JSON.stringify(payload), 'application/json');
      await expect(parseMcpResponse(resp)).resolves.toEqual(payload);
    });

    it('parses SSE response by extracting the data line', async () => {
      const payload = { result: { content: [{ text: 'hi' }] } };
      const sse = `event: message\ndata: ${JSON.stringify(payload)}\n\n`;
      const resp = makeResp(sse, 'text/event-stream');
      await expect(parseMcpResponse(resp)).resolves.toEqual(payload);
    });

    it('throws when SSE has no data line', async () => {
      const resp = makeResp('event: message\n\n', 'text/event-stream');
      await expect(parseMcpResponse(resp)).rejects.toThrow('No data line found in SSE response');
    });
  });

  describe('CORS', () => {
    it('returns Access-Control-Allow-Origin for allowed origin', async () => {
      const { headers } = await httpGet(port, '/health', {
        headers: { Origin: 'https://jeffcrosley.com' },
      });
      expect(headers['access-control-allow-origin']).toBe('https://jeffcrosley.com');
    });

    it('returns the configured origin header regardless of request origin', async () => {
      const { headers } = await httpGet(port, '/health', {
        headers: { Origin: 'https://evil.com' },
      });
      expect(headers['access-control-allow-origin']).toBe('https://jeffcrosley.com');
    });

    it('handles preflight OPTIONS request', async () => {
      const { status, headers } = await httpOptions(port, '/health', {
        Origin: 'https://jeffcrosley.com',
        'Access-Control-Request-Method': 'GET',
      });
      expect(status).toBe(204);
      expect(headers['access-control-allow-origin']).toBe('https://jeffcrosley.com');
    });
  });
});
