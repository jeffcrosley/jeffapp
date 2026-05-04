import http from 'http';
import { app, _resetTokenCache, getAccessToken } from './main';

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

const TOKEN_RESPONSE = {
  ok: true,
  status: 200,
  json: async () => ({ access_token: 'mock-access-token', expires_in: 3600 }),
};

const SESSION_ID = 'test-session-id';

const INIT_RESPONSE = {
  ok: true,
  status: 200,
  headers: { get: (name: string) => (name === 'mcp-session-id' ? SESSION_ID : null) },
  json: async () => ({}),
};

function mockFetchWithTokenExchange(...upstreamResponses: object[]): jest.Mock {
  const mock = jest.fn() as jest.Mock;
  mock.mockResolvedValueOnce(TOKEN_RESPONSE);
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
    it('returns 503 when GTD_AGENT_TOKEN is not set', async () => {
      const { status, body } = await httpGet(port, '/api/gtd/health');
      expect(status).toBe(503);
      expect((body as { error: string }).error).toMatch(/GTD_AGENT_TOKEN/);
    });

    it('returns reachable:true when token exchange succeeds', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      global.fetch = mockFetchWithTokenExchange();

      const { status, body } = await httpGet(port, '/api/gtd/health');
      expect(status).toBe(200);
      expect((body as { reachable: boolean }).reachable).toBe(true);
    });

    it('makes no outbound call beyond the token exchange', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      const mockFetch = mockFetchWithTokenExchange();
      global.fetch = mockFetch;

      await httpGet(port, '/api/gtd/health');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns reachable:false when token exchange throws', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error')) as jest.Mock;

      const { status, body } = await httpGet(port, '/api/gtd/health');
      expect(status).toBe(503);
      expect((body as { reachable: boolean }).reachable).toBe(false);
    });
  });

  describe('GET /api/gtd/tasks', () => {
    it('returns 503 when GTD_AGENT_TOKEN is not set', async () => {
      const { status, body } = await httpGet(port, '/api/gtd/tasks');
      expect(status).toBe(503);
      expect((body as { error: string }).error).toMatch(/GTD_AGENT_TOKEN/);
    });

    it('returns tasks array and total from MCP response', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      const mockTasks = [
        {
          id: '1',
          title: 'Write tests',
          project: 'jeffapp',
          status: 'in-progress',
          updated_at: new Date().toISOString(),
        },
      ];
      const mockFetch = jest.fn() as jest.Mock;
      mockFetch.mockResolvedValueOnce(TOKEN_RESPONSE);
      mockFetch.mockResolvedValueOnce(INIT_RESPONSE);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          result: { content: [{ text: JSON.stringify({ tasks: mockTasks, total: 1 }) }] },
        }),
      });
      global.fetch = mockFetch;

      const { status, body } = await httpGet(port, '/api/gtd/tasks?status=in-progress');
      expect(status).toBe(200);
      expect((body as { tasks: unknown[] }).tasks).toEqual(mockTasks);
      expect((body as { total: number }).total).toBe(1);
    });

    it('returns empty tasks and zero total when MCP content is missing', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      const mockFetch = jest.fn() as jest.Mock;
      mockFetch.mockResolvedValueOnce(TOKEN_RESPONSE);
      mockFetch.mockResolvedValueOnce(INIT_RESPONSE);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: {} }),
      });
      global.fetch = mockFetch;

      const { status, body } = await httpGet(port, '/api/gtd/tasks');
      expect(status).toBe(200);
      expect((body as { tasks: unknown[] }).tasks).toEqual([]);
      expect((body as { total: number }).total).toBe(0);
    });

    it('returns 502 when MCP call throws', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      const mockFetch = jest.fn() as jest.Mock;
      mockFetch.mockResolvedValueOnce(TOKEN_RESPONSE);
      mockFetch.mockResolvedValueOnce(INIT_RESPONSE);
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
      global.fetch = mockFetch;

      const { status } = await httpGet(port, '/api/gtd/tasks');
      expect(status).toBe(502);
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
