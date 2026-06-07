// apps/api-gateway/src/lib/sse.ts
import { Express, Request, Response } from 'express';
import { eventBusClient } from './redis';

const SSE_CHANNELS = ['jeff:dispatch', 'jeff:gtd', 'jeff:system'] as const;

export function registerSseRoute(app: Express): void {
  app.get('/events', async (req: Request, res: Response) => {
    const userId = (req.session as any)?.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`event: connection.established\ndata: ${JSON.stringify({ userId })}\n\n`);

    const sub = eventBusClient.duplicate();
    await sub.connect();

    const userChannel = `jeff:user:${userId}`;
    const channels = [userChannel, ...SSE_CHANNELS];

    const messageHandler = (_message: string, channel: string) => {
      res.write(`data: ${JSON.stringify({ channel, payload: _message })}\n\n`);
    };

    for (const channel of channels) {
      await sub.subscribe(channel, messageHandler);
    }

    const ping = setInterval(() => {
      res.write(': ping\n\n');
    }, 30_000);

    req.on('close', () => {
      clearInterval(ping);
      sub.unsubscribe().finally(() => sub.quit().catch(() => {}));
    });
  });
}
