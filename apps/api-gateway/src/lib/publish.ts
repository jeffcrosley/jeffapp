// apps/api-gateway/src/lib/publish.ts
import { eventBusClient } from './redis';

export async function publishEvent(
  channel: string,
  type: string,
  data: unknown
): Promise<void> {
  const event = JSON.stringify({ type, timestamp: new Date().toISOString(), data });
  await eventBusClient.publish(channel, event);
}
