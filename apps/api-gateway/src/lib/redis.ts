// apps/api-gateway/src/lib/redis.ts
// personal-redis: used for the event bus (pub/sub). Separate from jeffapp-sessions.
import { createClient } from 'redis';

export const eventBusClient = createClient({
  url: process.env['PERSONAL_REDIS_URL'] ?? process.env['REDIS_URL'],
});
