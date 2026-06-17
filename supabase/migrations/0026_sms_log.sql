-- SMS notification log
-- Tracks every outbound SMS (order status updates + memory garden reminders)
CREATE TABLE sms_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  phone       text        NOT NULL,
  message     text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('order_status', 'memory_reminder')),
  ref_id      text,       -- order id (as text) or memory_date id (uuid as text)
  ok          boolean     DEFAULT true NOT NULL,
  error       text
);

ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_log_admin_all" ON sms_log
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
