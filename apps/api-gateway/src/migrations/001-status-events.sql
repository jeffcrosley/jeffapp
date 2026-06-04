CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  authentik_sub TEXT UNIQUE,
  callmebot_phone TEXT,
  callmebot_apikey TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  color TEXT NOT NULL CHECK (color IN ('green', 'yellow', 'red', 'tap_out')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_status_events_user_created
  ON status_events (user_id, created_at DESC);
