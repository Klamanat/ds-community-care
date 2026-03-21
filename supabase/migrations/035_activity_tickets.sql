-- 035_activity_tickets.sql
-- Add ticket-booking system to activities

-- Extend activities table with ticket fields
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS ticket_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ticket_price integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ticket_capacity integer DEFAULT null, -- null = unlimited
ADD COLUMN IF NOT EXISTS ticket_note text DEFAULT '';

-- Ticket bookings table
CREATE TABLE IF NOT EXISTS activity_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    activity_id text NOT NULL REFERENCES activities (id) ON DELETE CASCADE,
    employee_id text NOT NULL,
    employee_name text NOT NULL,
    ticket_no text NOT NULL,
    qr_token text UNIQUE NOT NULL DEFAULT encode (gen_random_bytes (16), 'hex'),
    status text NOT NULL DEFAULT 'booked',
    price integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now (),
    cancelled_at timestamptz,
    checked_in_at timestamptz,
    UNIQUE (activity_id, employee_id)
);

ALTER TABLE activity_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_select" ON activity_tickets FOR
SELECT USING (true);

CREATE POLICY "tickets_insert" ON activity_tickets FOR
INSERT
WITH
    CHECK (true);

CREATE POLICY "tickets_update" ON activity_tickets
FOR UPDATE
    USING (true);

CREATE POLICY "tickets_delete" ON activity_tickets FOR DELETE USING (
    (
        auth.jwt () - > 'user_metadata' - >> 'role'
    ) = 'admin'
);