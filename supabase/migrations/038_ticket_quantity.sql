-- 038_ticket_quantity.sql
-- Allow booking multiple tickets per person

ALTER TABLE activity_tickets
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;
