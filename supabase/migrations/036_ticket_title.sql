-- 036_ticket_title.sql
-- Add ticket_title field to activities (displayed on the ticket card)

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS ticket_title text DEFAULT '';
