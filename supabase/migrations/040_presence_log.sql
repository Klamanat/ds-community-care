-- 040_presence_log.sql
-- Daily active user log (one row per user per day)

CREATE TABLE IF NOT EXISTS user_presence_log (
  date          date NOT NULL,
  employee_name text NOT NULL,
  dept          text,
  PRIMARY KEY (date, employee_name)
);

ALTER TABLE user_presence_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "log_all" ON user_presence_log FOR ALL USING (true) WITH CHECK (true);
