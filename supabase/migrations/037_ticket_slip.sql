-- 037_ticket_slip.sql
-- Add payment slip upload to activity_tickets

ALTER TABLE activity_tickets
  ADD COLUMN IF NOT EXISTS slip_url text DEFAULT '';

-- 'pending_slip' is a new valid status value (no constraint change needed,
-- status is just text). Flow: pending_slip → booked → checked_in
