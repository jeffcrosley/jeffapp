import http from 'http';
import { app } from './main';

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

// Use Node's http.request so global.fetch mocks don't interfere
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

describe('api-gateway', () => {
  let server: http.Server;
  let port: number;
  let originalFetch: typeof global.fetch;

  beforeEach(async () => {
    originalFetch = global.fetch;
    ({ server, port } = await startServer());
  });

  afterEach(async () => {
    delete process.env['GTD_AGENT_TOKEN'];
    global.fetch = originalFetch;
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

    it('returns reachable:true on successful upstream response', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
      }) as jest.Mock;

      const { status, body } = await httpGet(port, '/api/gtd/health');
      expect(status).toBe(200);
      expect((body as { reachable: boolean }).reachable).toBe(true);
    });

    it('returns reachable:false when upstream throws', async () => {
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

    it('returns tasks array from MCP response', async () => {
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
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          result: { content: [{ text: JSON.stringify(mockTasks) }] },
        }),
      }) as jest.Mock;

      const { status, body } = await httpGet(port, '/api/gtd/tasks?status=in-progress');
      expect(status).toBe(200);
      expect((body as { tasks: unknown[] }).tasks).toEqual(mockTasks);
    });

    it('returns empty tasks array when MCP content is missing', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: {} }),
      }) as jest.Mock;

      const { status, body } = await httpGet(port, '/api/gtd/tasks');
      expect(status).toBe(200);
      expect((body as { tasks: unknown[] }).tasks).toEqual([]);
    });

    it('returns 502 when fetch throws', async () => {
      process.env['GTD_AGENT_TOKEN'] = 'test-token';
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Connection refused')) as jest.Mock;

      const { status } = await httpGet(port, '/api/gtd/tasks');
      expect(status).toBe(502);
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
      // cors with a string origin always sends the configured value;
      // browsers enforce the restriction by comparing with the actual request origin.
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
