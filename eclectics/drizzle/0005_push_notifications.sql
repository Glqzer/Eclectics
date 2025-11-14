CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS sent_notifications (
  id SERIAL PRIMARY KEY,
  subscription_endpoint TEXT NOT NULL,
  schedule_id INTEGER NOT NULL,
  sent_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sent_notifications_schedule ON sent_notifications (schedule_id);
CREATE INDEX IF NOT EXISTS idx_sent_notifications_endpoint ON sent_notifications (subscription_endpoint);
