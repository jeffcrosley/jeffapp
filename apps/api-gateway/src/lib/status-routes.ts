import { Router } from 'express';
import { getPool } from './db';
import { AuthenticatedRequest, requireJwt } from './jwt';
import {
  sendSignalNotification,
  formatStatusMessage,
  formatAckMessage,
} from './notify';

export const statusRouter = Router();
statusRouter.use(requireJwt);

statusRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const { color, note } = req.body ?? {};
  if (!color || !['green', 'yellow', 'red', 'tap_out'].includes(color)) {
    res.status(400).json({ error: 'invalid_color' });
    return;
  }

  const pool = getPool();
  const sub = req.authentikSub;

  const userRow = await pool.query(
    'SELECT id, name FROM users WHERE authentik_sub = $1',
    [sub]
  );
  if (userRow.rowCount === 0) {
    res.status(403).json({ error: 'user_not_found' });
    return;
  }
  const sender = userRow.rows[0];

  const result = await pool.query(
    `INSERT INTO status_events (user_id, color, note)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, color, note, created_at`,
    [sender.id, color, note ?? null]
  );

  const otherUsers = await pool.query(
    'SELECT callmebot_phone, callmebot_apikey FROM users WHERE id != $1 AND callmebot_phone IS NOT NULL',
    [sender.id]
  );
  for (const target of otherUsers.rows) {
    sendSignalNotification(
      { phone: target.callmebot_phone, apikey: target.callmebot_apikey },
      formatStatusMessage(sender.name, color)
    );
  }

  res.status(201).json({ event: result.rows[0] });
});

statusRouter.get('/current/:userId', async (req: AuthenticatedRequest, res) => {
  const { userId } = req.params;
  const pool = getPool();

  const result = await pool.query(
    `SELECT se.id, se.user_id, se.color, se.note, se.created_at,
            se.acknowledged_at, se.acknowledged_by, u.name as user_name
     FROM status_events se
     JOIN users u ON u.id = se.user_id
     WHERE se.user_id = $1
     ORDER BY se.created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rowCount === 0) {
    res.status(200).json({ event: null });
    return;
  }

  res.status(200).json({ event: result.rows[0] });
});

statusRouter.post('/:eventId/acknowledge', async (req: AuthenticatedRequest, res) => {
  const { eventId } = req.params;
  const pool = getPool();
  const sub = req.authentikSub;

  const ackerRow = await pool.query(
    'SELECT id, name FROM users WHERE authentik_sub = $1',
    [sub]
  );
  if (ackerRow.rowCount === 0) {
    res.status(403).json({ error: 'user_not_found' });
    return;
  }
  const acker = ackerRow.rows[0];

  const result = await pool.query(
    `UPDATE status_events
     SET acknowledged_at = now(), acknowledged_by = $1
     WHERE id = $2 AND acknowledged_at IS NULL
     RETURNING id, user_id, color, acknowledged_at, acknowledged_by`,
    [acker.id, eventId]
  );

  if (result.rowCount === 0) {
    res.status(404).json({ error: 'event_not_found_or_already_acknowledged' });
    return;
  }

  const event = result.rows[0];
  const ownerRow = await pool.query(
    'SELECT callmebot_phone, callmebot_apikey FROM users WHERE id = $1 AND callmebot_phone IS NOT NULL',
    [event.user_id]
  );
  if (ownerRow.rowCount > 0) {
    const target = ownerRow.rows[0];
    sendSignalNotification(
      { phone: target.callmebot_phone, apikey: target.callmebot_apikey },
      formatAckMessage(acker.name, event.color)
    );
  }

  res.status(200).json({ event });
});

statusRouter.get('/history', async (req: AuthenticatedRequest, res) => {
  const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 100);
  const offset = parseInt(req.query['offset'] as string) || 0;
  const pool = getPool();

  const result = await pool.query(
    `SELECT se.id, se.user_id, se.color, se.note, se.created_at,
            se.acknowledged_at, se.acknowledged_by,
            u.name as user_name,
            ack_u.name as acknowledged_by_name
     FROM status_events se
     JOIN users u ON u.id = se.user_id
     LEFT JOIN users ack_u ON ack_u.id = se.acknowledged_by
     ORDER BY se.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await pool.query('SELECT count(*) FROM status_events');
  const total = parseInt(countResult.rows[0].count);

  res.status(200).json({ events: result.rows, total });
});

statusRouter.get('/me', async (req: AuthenticatedRequest, res) => {
  const pool = getPool();
  const sub = req.authentikSub;
  const result = await pool.query(
    'SELECT id, name FROM users WHERE authentik_sub = $1',
    [sub]
  );
  if (result.rowCount === 0) {
    res.status(404).json({ error: 'user_not_found' });
    return;
  }
  res.status(200).json({ user: result.rows[0] });
});

statusRouter.get('/users', async (req: AuthenticatedRequest, res) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT id, name FROM users ORDER BY name'
  );
  res.status(200).json({ users: result.rows });
});
