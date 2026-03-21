-- 039_ticket_open_at.sql
-- Add booking open date to activities

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS ticket_open_at timestamptz DEFAULT null;
