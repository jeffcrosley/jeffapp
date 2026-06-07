// apps/api-gateway/src/lib/redis.ts
// personal-redis: used for the event bus (pub/sub). Separate from jeffapp-sessions.
import { createClient } from 'redis';

export const eventBusClient = createClient({
  url: process.env['PERSONAL_REDIS_URL'] ?? process.env['REDIS_URL'],
});

// The event bus is non-critical. Swallow connection/runtime errors so an
// unhandled 'error' event can never crash the gateway process. SSE simply
// degrades when the bus is unavailable.
eventBusClient.on('error', (err) => {
  console.warn('Event bus Redis error (non-fatal):', err?.message ?? err);
});
