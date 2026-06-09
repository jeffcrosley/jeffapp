import http from 'http';
import net from 'net';
import express from 'express';
import { healthRouter, getServiceConfigs, checkService, tcpCheck } from './health-check';

type AddressInfo = { port: number };

function startHttpServer(): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const app = express();
    app.use('/api/health', healthRouter);
    const server = http.createServer(app);
    server.listen(0, () => {
      resolve({ server, port: (server.address() as AddressInfo).port });
    });
  });
}

function stopHttpServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

function startTcpServer(): Promise<{ server: net.Server; port: number }> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      resolve({ server, port: (server.address() as AddressInfo).port });
    });
  });
}

function stopTcpServer(server: net.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

function httpGet(port: number, path: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: 'localhost', port, path }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode ?? 0, body: JSON.parse(raw) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
}

describe('healthRouter GET /api/health/services', () => {
  let server: http.Server;
  let port: number;
  let originalFetch: typeof global.fetch;

  beforeEach(async () => {
    originalFetch = global.fetch;
    delete process.env['HEALTH_CHECK_MODE'];
    ({ server, port } = await startHttpServer());
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    delete process.env['HEALTH_CHECK_MODE'];
    await stopHttpServer(server);
  });

  it('returns 200 with required top-level fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as typeof global.fetch;
    const { status, body } = await httpGet(port, '/api/health/services');
    expect(status).toBe(200);
    const b = body as { timestamp: string; services: unknown[]; summary: Record<string, number> };
    expect(typeof b.timestamp).toBe('string');
    expect(Array.isArray(b.services)).toBe(true);
    expect(typeof b.summary.total).toBe('number');
    expect(typeof b.summary.healthy).toBe('number');
    expect(typeof b.summary.down).toBe('number');
  });

  it('each service entry has required fields with valid values', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as typeof global.fetch;
    const { body } = await httpGet(port, '/api/health/services');
    const b = body as { services: Array<Record<string, unknown>> };
    for (const svc of b.services) {
      expect(typeof svc['name']).toBe('string');
      expect(['infrastructure', 'aia-services', 'agent-ops']).toContain(svc['category']);
      expect(['healthy', 'degraded', 'down', 'unknown']).toContain(svc['status']);
      expect('last_checked' in svc).toBe(true);
      expect('latency_ms' in svc).toBe(true);
    }
  });

  it('service entries do not expose internal URLs', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as typeof global.fetch;
    const { body } = await httpGet(port, '/api/health/services');
    const b = body as { services: Array<Record<string, unknown>> };
    for (const svc of b.services) {
      expect('url' in svc).toBe(false);
    }
  });

  it('summary.total equals services array length', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as typeof global.fetch;
    const { body } = await httpGet(port, '/api/health/services');
    const b = body as { services: unknown[]; summary: { total: number } };
    expect(b.summary.total).toBe(b.services.length);
  });

  it('HEALTH_CHECK_MODE=render returns fewer services than local mode', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as typeof global.fetch;

    delete process.env['HEALTH_CHECK_MODE'];
    const { body: localBody } = await httpGet(port, '/api/health/services');
    const localCount = (localBody as { services: unknown[] }).services.length;

    process.env['HEALTH_CHECK_MODE'] = 'render';
    const { body: renderBody } = await httpGet(port, '/api/health/services');
    const renderCount = (renderBody as { services: unknown[] }).services.length;

    expect(renderCount).toBeGreaterThan(0);
    expect(renderCount).toBeLessThan(localCount);
  });
});

describe('getServiceConfigs', () => {
  beforeEach(() => { delete process.env['HEALTH_CHECK_MODE']; delete process.env['PERSONAL_REDIS_URL']; });
  afterEach(() => { delete process.env['HEALTH_CHECK_MODE']; delete process.env['PERSONAL_REDIS_URL']; });

  it('includes localOnly services in local mode', () => {
    const configs = getServiceConfigs();
    expect(configs.some(s => s.localOnly)).toBe(true);
  });

  it('excludes all localOnly services in render mode', () => {
    process.env['HEALTH_CHECK_MODE'] = 'render';
    const configs = getServiceConfigs();
    expect(configs.every(s => !s.localOnly)).toBe(true);
    expect(configs.length).toBeGreaterThan(0);
  });

  it('uses PERSONAL_REDIS_URL env var for Redis check', () => {
    process.env['PERSONAL_REDIS_URL'] = 'redis://myredis:6379';
    const configs = getServiceConfigs();
    const redis = configs.find(s => s.name === 'Redis (personal)');
    expect(redis?.url).toBe('redis://myredis:6379');
  });

  it('Redis (personal) URL is undefined when env var not set', () => {
    delete process.env['PERSONAL_REDIS_URL'];
    const configs = getServiceConfigs();
    const redis = configs.find(s => s.name === 'Redis (personal)');
    expect(redis?.url).toBeUndefined();
  });
});

describe('checkService', () => {
  let originalFetch: typeof global.fetch;
  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  it('returns unknown when URL is not configured', async () => {
    const result = await checkService({ name: 'test', category: 'infrastructure', url: undefined, check: 'http' });
    expect(result.status).toBe('unknown');
    expect(result.details).toMatch(/URL not configured/i);
    expect(result.latency_ms).toBeNull();
  });

  it('returns healthy for successful HTTP check', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as typeof global.fetch;
    const result = await checkService({ name: 'test', category: 'aia-services', url: 'http://localhost:9999/health', check: 'http' });
    expect(result.status).toBe('healthy');
    expect(typeof result.latency_ms).toBe('number');
    expect(result.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it('returns healthy for HTTP 404 (no health endpoint)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as typeof global.fetch;
    const result = await checkService({ name: 'test', category: 'aia-services', url: 'http://localhost:9999/', check: 'http' });
    expect(result.status).toBe('healthy');
  });

  it('returns down for HTTP 5xx response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as typeof global.fetch;
    const result = await checkService({ name: 'test', category: 'aia-services', url: 'http://localhost:9999/health', check: 'http' });
    expect(result.status).toBe('down');
    expect(result.details).toMatch(/HTTP 500/);
  });

  it('returns down when HTTP fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) as typeof global.fetch;
    const result = await checkService({ name: 'test', category: 'aia-services', url: 'http://localhost:9999/health', check: 'http' });
    expect(result.status).toBe('down');
  });

  it('returns down for TCP to non-listening port', async () => {
    const result = await checkService({ name: 'pg', category: 'infrastructure', url: 'postgresql://localhost:59997', check: 'tcp' });
    expect(result.status).toBe('down');
  }, 5000);

  it('category is preserved in result', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as typeof global.fetch;
    const result = await checkService({ name: 'test', category: 'agent-ops', url: 'http://localhost:9999/health', check: 'http' });
    expect(result.category).toBe('agent-ops');
  });
});

describe('tcpCheck', () => {
  it('resolves when a TCP server is listening', async () => {
    const { server, port } = await startTcpServer();
    try {
      await expect(tcpCheck('localhost', port, 2000)).resolves.toBeUndefined();
    } finally {
      await stopTcpServer(server);
    }
  });

  it('rejects with an error when nothing is listening', async () => {
    await expect(tcpCheck('localhost', 59996, 2000)).rejects.toThrow();
  }, 5000);
});
