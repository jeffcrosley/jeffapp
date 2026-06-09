// apps/api-gateway/src/lib/health-check.ts

import net from 'net';
import { Router } from 'express';

type ServiceCategory = 'infrastructure' | 'aia-services' | 'agent-ops';
type CheckType = 'http' | 'tcp' | 'redis';
type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface ServiceConfig {
  name: string;
  category: ServiceCategory;
  url: string | undefined;
  check: CheckType;
  optional?: boolean;
  localOnly?: boolean;
}

export interface ServiceHealth {
  name: string;
  category: ServiceCategory;
  status: HealthStatus;
  latency_ms: number | null;
  last_checked: string;
  details?: string;
}

export interface HealthResponse {
  timestamp: string;
  services: ServiceHealth[];
  summary: { healthy: number; down: number; total: number };
}

function parseTcpTarget(url: string): { host: string; port: number } {
  const parsed = new URL(url);
  const defaultPort = parsed.protocol === 'postgresql:' ? 5432 : 6379;
  return {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port, 10) || defaultPort,
  };
}

export function tcpCheck(host: string, port: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(new Error('TCP connection timeout'));
      }
    }, timeoutMs);
    socket.connect(port, host, () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        resolve();
      }
    });
    socket.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    });
  });
}

export function redisCheck(url: string, timeoutMs: number): Promise<void> {
  const { host, port } = parseTcpTarget(url);
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(new Error('Redis connection timeout'));
      }
    }, timeoutMs);
    socket.connect(port, host, () => {
      socket.write('PING\r\n');
    });
    socket.on('data', (data) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        if (data.toString().includes('+PONG')) {
          resolve();
        } else {
          reject(new Error(`Unexpected Redis response: ${data.toString().slice(0, 20)}`));
        }
      }
    });
    socket.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    });
  });
}

export function getServiceConfigs(): ServiceConfig[] {
  const isRenderMode = process.env['HEALTH_CHECK_MODE'] === 'render';

  const infrastructure: ServiceConfig[] = [
    { name: 'PostgreSQL', category: 'infrastructure', url: 'postgresql://localhost:5432', check: 'tcp', localOnly: true },
    { name: 'Redpanda', category: 'infrastructure', url: 'http://localhost:9644/v1/cluster', check: 'http', localOnly: true },
    { name: 'Temporal', category: 'infrastructure', url: 'http://localhost:7234/health', check: 'http', localOnly: true },
    { name: 'Airflow', category: 'infrastructure', url: 'http://localhost:8081/health', check: 'http', localOnly: true },
    { name: 'LocalStack', category: 'infrastructure', url: 'http://localhost:4566/_localstack/health', check: 'http', localOnly: true },
    { name: 'Redis (personal)', category: 'infrastructure', url: process.env['PERSONAL_REDIS_URL'], check: 'redis' },
  ];

  const aiaServices: ServiceConfig[] = [
    { name: 'rest-api', category: 'aia-services', url: process.env['REST_API_URL'] ?? 'http://localhost:8000/health', check: 'http' },
    { name: 'doc-repo-api', category: 'aia-services', url: process.env['DOC_REPO_API_URL'] ?? 'http://localhost:8001/health', check: 'http' },
    { name: 'sse-service', category: 'aia-services', url: process.env['SSE_SERVICE_URL'] ?? 'http://localhost:8002/health', check: 'http' },
  ];

  const agentOps: ServiceConfig[] = [
    { name: 'Dispatch Worker', category: 'agent-ops', url: 'http://localhost:9001/health', check: 'http', optional: true, localOnly: true },
    { name: 'Temporal Namespace', category: 'agent-ops', url: 'http://localhost:7234/api/v1/namespaces/agent-dispatch', check: 'http', localOnly: true },
  ];

  const all = [...infrastructure, ...aiaServices, ...agentOps];
  return isRenderMode ? all.filter(s => !s.localOnly) : all;
}

export async function checkService(service: ServiceConfig): Promise<ServiceHealth> {
  const start = Date.now();
  const base = { name: service.name, category: service.category };

  if (!service.url) {
    return { ...base, status: 'unknown', latency_ms: null, last_checked: new Date().toISOString(), details: 'URL not configured' };
  }

  try {
    if (service.check === 'tcp') {
      const { host, port } = parseTcpTarget(service.url);
      await tcpCheck(host, port, 2000);
    } else if (service.check === 'redis') {
      await redisCheck(service.url, 2000);
    } else {
      const res = await fetch(service.url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    }
    return { ...base, status: 'healthy', latency_ms: Date.now() - start, last_checked: new Date().toISOString() };
  } catch (err) {
    return { ...base, status: 'down', latency_ms: null, last_checked: new Date().toISOString(), details: (err as Error).message };
  }
}

export const healthRouter = Router();

healthRouter.get('/services', async (_req, res) => {
  const services = getServiceConfigs();

  const allChecks = Promise.allSettled(services.map(checkService));
  const timeoutSignal = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4500));

  const winner = await Promise.race([allChecks, timeoutSignal]);

  let serviceHealths: ServiceHealth[];
  if (winner !== null) {
    serviceHealths = (winner as PromiseSettledResult<ServiceHealth>[]).map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : {
            name: services[i].name,
            category: services[i].category,
            status: 'unknown' as HealthStatus,
            latency_ms: null,
            last_checked: new Date().toISOString(),
          }
    );
  } else {
    serviceHealths = services.map(s => ({
      name: s.name,
      category: s.category,
      status: 'unknown' as HealthStatus,
      latency_ms: null,
      last_checked: new Date().toISOString(),
      details: 'Overall timeout',
    }));
  }

  const body: HealthResponse = {
    timestamp: new Date().toISOString(),
    services: serviceHealths,
    summary: {
      healthy: serviceHealths.filter(s => s.status === 'healthy').length,
      down: serviceHealths.filter(s => s.status === 'down').length,
      total: services.length,
    },
  };

  res.json(body);
});
