import http from 'http';
import session from 'express-session';

// Mock session module before importing app
const memoryStore = new session.MemoryStore();
const sessionMiddleware = session({
  store: memoryStore,
  secret: 'test-secret',
  name: 'jeffapp.sid',
  resave: false,
  saveUninitialized: false,
});

jest.mock('./session', () => ({
  redisClient: { connect: jest.fn() },
  buildSessionMiddleware: () => sessionMiddleware,
  requireSession: (req: any, res: any, next: any) => {
    if (!req.session?.user?.id || !req.session?.mcp?.accessToken) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    next();
  },
  getSessionMcpToken: jest.fn().mockImplementation(async (req: any) => {
    const mcp = req.session?.mcp;
    if (!mcp?.accessToken) throw new Error('No MCP token in session');
    return mcp.accessToken;
  }),
}));

// Import app AFTER mocking
import { app, _resetTokenCache } from '../main';
import { loginRateLimiter } from './auth-routes';

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

interface RequestResult {
  status: number;
  body: unknown;
  headers: Record<string, string | string[]>;
}

function httpRequest(
  port: number,
  method: string,
  path: string,
  options: { headers?: Record<string, string>; body?: string } = {}
): Promise<RequestResult> {
  return new Promise((resolve, reject) => {
    const reqOptions: http.RequestOptions = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode ?? 0,
            body: raw ? JSON.parse(raw) : {},
            headers: res.headers as Record<string, string | string[]>,
          });
        } catch {
          resolve({ status: res.statusCode ?? 0, body: raw, headers: res.headers as Record<string, string | string[]> });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function httpGet(port: number, path: string, headers: Record<string, string> = {}): Promise<RequestResult> {
  return httpRequest(port, 'GET', path, { headers });
}

function httpPost(port: number, path: string, body: unknown, headers: Record<string, string> = {}): Promise<RequestResult> {
  return httpRequest(port, 'POST', path, { headers, body: JSON.stringify(body) });
}

function extractCookie(headers: Record<string, string | string[]>): string {
  const raw = headers['set-cookie'];
  if (!raw) return '';
  const cookies = Array.isArray(raw) ? raw : [raw];
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

const VALID_TOKEN_RESPONSE = {
  ok: true,
  status: 200,
  json: async () => ({
    access_token: 'session-access-token',
    refresh_token: 'session-refresh-token',
    expires_in: 3600,
  }),
};

const SESSION_ID = 'test-mcp-session-id';
const INIT_RESPONSE = {
  ok: true,
  status: 200,
  headers: { get: (name: string) => (name === 'mcp-session-id' ? SESSION_ID : null) },
  json: async () => ({}),
};

describe('auth routes', () => {
  let server: http.Server;
  let port: number;
  let originalFetch: typeof global.fetch;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalFetch = global.fetch;
    originalEnv = { ...process.env };
    process.env['GTD_AGENT_TOKEN'] = 'test-agent-token';
    process.env['SESSION_SECRET'] = 'test-secret';
    process.env['SESSION_REDIS_URL'] = 'redis://localhost:6379';
    _resetTokenCache();
    ({ server, port } = await startServer());
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    _resetTokenCache();
    // Reset rate limiter so one test's requests don't bleed into the next
    loginRateLimiter.resetKey('::ffff:127.0.0.1');
    loginRateLimiter.resetKey('127.0.0.1');
    await stopServer(server);
  });

  describe('POST /auth/login', () => {
    it('returns 200 and sets cookie with valid credentials', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(VALID_TOKEN_RESPONSE) as jest.Mock;

      const result = await httpPost(port, '/auth/login', { username: 'jeff', password: 'correct-pass' });

      expect(result.status).toBe(200);
      expect((result.body as { user: { id: string } }).user.id).toBe('jeff');
      expect(result.headers['set-cookie']).toBeDefined();
    });

    it('returns 401 with wrong password', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 401 }) as jest.Mock;

      const result = await httpPost(port, '/auth/login', { username: 'jeff', password: 'wrong-pass' });

      expect(result.status).toBe(401);
      expect((result.body as { error: string }).error).toBe('invalid_credentials');
    });

    it('returns 400 when fields are missing', async () => {
      const result = await httpPost(port, '/auth/login', { username: 'jeff' });
      expect(result.status).toBe(400);
      expect((result.body as { error: string }).error).toBe('invalid_request');
    });

    it('returns 400 when body is empty', async () => {
      const result = await httpPost(port, '/auth/login', {});
      expect(result.status).toBe(400);
    });

    it('returns 429 after 10 requests (11th triggers rate limit)', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 }) as jest.Mock;

      for (let i = 0; i < 10; i++) {
        await httpPost(port, '/auth/login', { username: 'jeff', password: 'wrong' });
      }

      global.fetch = jest.fn().mockResolvedValue(VALID_TOKEN_RESPONSE) as jest.Mock;
      const result = await httpPost(port, '/auth/login', { username: 'jeff', password: 'correct-pass' });

      expect(result.status).toBe(429);
    });

    it('forwards 429 from MCP token endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 429 }) as jest.Mock;

      const result = await httpPost(port, '/auth/login', { username: 'jeff', password: 'any' });
      expect(result.status).toBe(429);
    });
  });

  describe('GET /auth/me', () => {
    it('returns 200 with user when session is active', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(VALID_TOKEN_RESPONSE) as jest.Mock;

      const loginResult = await httpPost(port, '/auth/login', { username: 'jeff', password: 'correct-pass' });
      expect(loginResult.status).toBe(200);

      const cookie = extractCookie(loginResult.headers);
      const meResult = await httpGet(port, '/auth/me', { Cookie: cookie });

      expect(meResult.status).toBe(200);
      expect((meResult.body as { user: { id: string } }).user.id).toBe('jeff');
    });

    it('returns 401 without session', async () => {
      const result = await httpGet(port, '/auth/me');
      expect(result.status).toBe(401);
      expect((result.body as { error: string }).error).toBe('unauthorized');
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 200 and clears cookie when session is active', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(VALID_TOKEN_RESPONSE)
        .mockResolvedValueOnce({ ok: true }) as jest.Mock;

      const loginResult = await httpPost(port, '/auth/login', { username: 'jeff', password: 'correct-pass' });
      const cookie = extractCookie(loginResult.headers);

      const logoutResult = await httpPost(port, '/auth/logout', {}, { Cookie: cookie });

      expect(logoutResult.status).toBe(200);
      expect((logoutResult.body as { ok: boolean }).ok).toBe(true);
      const clearedCookie = logoutResult.headers['set-cookie'];
      expect(clearedCookie).toBeDefined();
    });

    it('returns 200 even without a session cookie', async () => {
      const result = await httpPost(port, '/auth/logout', {});
      expect(result.status).toBe(200);
    });
  });

  describe('GET /api/gtd/tasks (session guard)', () => {
    it('returns 401 without session', async () => {
      const result = await httpGet(port, '/api/gtd/tasks');
      expect(result.status).toBe(401);
      expect((result.body as { error: string }).error).toBe('unauthorized');
    });

    it('passes through to MCP when session is active', async () => {
      const mockTasks = [{ id: '1', title: 'Test task', status: 'in-progress' }];

      global.fetch = jest.fn()
        .mockResolvedValueOnce(VALID_TOKEN_RESPONSE)
        .mockResolvedValueOnce(INIT_RESPONSE)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            result: { content: [{ text: JSON.stringify({ tasks: mockTasks, total: 1 }) }] },
          }),
        }) as jest.Mock;

      const loginResult = await httpPost(port, '/auth/login', { username: 'jeff', password: 'correct-pass' });
      expect(loginResult.status).toBe(200);
      const cookie = extractCookie(loginResult.headers);

      _resetTokenCache();

      const tasksResult = await httpGet(port, '/api/gtd/tasks', { Cookie: cookie });
      expect(tasksResult.status).toBe(200);
      expect((tasksResult.body as { tasks: unknown[] }).tasks).toEqual(mockTasks);
    });
  });
});
