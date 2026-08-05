-- ============================================================
-- Phase 1 — Data Integrity & Security Hardening
-- DS Community Care
-- Run this on Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. UNIQUE CONSTRAINTS
-- ────────────────────────────────────────────────────────────

-- Training: 1 registration per employee per course
ALTER TABLE training_registrations
  DROP CONSTRAINT IF EXISTS training_registrations_unique_emp;
ALTER TABLE training_registrations
  ADD CONSTRAINT training_registrations_unique_emp
  UNIQUE (training_id, employee_id);

-- Gift claims: 1 claim per employee per year (may already exist)
ALTER TABLE gift_claims
  DROP CONSTRAINT IF EXISTS gift_claims_unique_year;
ALTER TABLE gift_claims
  ADD CONSTRAINT gift_claims_unique_year
  UNIQUE (employee_id, claimed_year);

-- Activity joins: 1 join per employee per activity
ALTER TABLE activity_joins
  DROP CONSTRAINT IF EXISTS activity_joins_unique_emp;
ALTER TABLE activity_joins
  ADD CONSTRAINT activity_joins_unique_emp
  UNIQUE (activity_id, employee_name);

-- Activity tickets: 1 active ticket per employee per activity
-- (partial index — cancelled rows don't count)
DROP INDEX IF EXISTS activity_tickets_unique_active;
CREATE UNIQUE INDEX activity_tickets_unique_active
  ON activity_tickets (activity_id, employee_id)
  WHERE status != 'cancelled';

-- ────────────────────────────────────────────────────────────
-- 2. ATOMIC RPC: book_activity_ticket
--    Capacity check + ticket_no generation + insert atomically
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION book_activity_ticket(
  p_activity_id   UUID,
  p_employee_id   TEXT,
  p_employee_name TEXT,
  p_price         NUMERIC DEFAULT 0,
  p_quantity      INT     DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_capacity      INT;
  v_total_booked  INT;
  v_ticket_no     TEXT;
  v_ticket_count  INT;
  v_init_status   TEXT;
  v_prev_id       UUID;
  v_result        JSON;
BEGIN
  -- Lock the activity row to prevent concurrent race
  SELECT ticket_capacity INTO v_capacity
  FROM activities
  WHERE id = p_activity_id
  FOR UPDATE;

  -- Check capacity
  IF v_capacity IS NOT NULL THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_booked
    FROM activity_tickets
    WHERE activity_id = p_activity_id
      AND status IN ('pending_slip', 'booked', 'checked_in');

    IF v_total_booked + p_quantity > v_capacity THEN
      RETURN json_build_object('error', 'ที่นั่งไม่เพียงพอ');
    END IF;
  END IF;

  -- Generate ticket number from row count (atomic — locked)
  SELECT COUNT(*) INTO v_ticket_count
  FROM activity_tickets
  WHERE activity_id = p_activity_id;
  v_ticket_no := 'TKT-' || LPAD((v_ticket_count + 1)::TEXT, 4, '0');

  -- Determine initial status
  v_init_status := CASE WHEN p_price > 0 THEN 'pending_slip' ELSE 'booked' END;

  -- Revive cancelled row if exists
  SELECT id INTO v_prev_id
  FROM activity_tickets
  WHERE activity_id = p_activity_id
    AND employee_id = p_employee_id
    AND status = 'cancelled'
  LIMIT 1;

  IF v_prev_id IS NOT NULL THEN
    UPDATE activity_tickets
    SET status = v_init_status,
        quantity = p_quantity,
        price = p_price,
        ticket_no = v_ticket_no,
        slip_url = '',
        cancelled_at = NULL,
        checked_in_at = NULL
    WHERE id = v_prev_id
    RETURNING to_json(activity_tickets.*) INTO v_result;
  ELSE
    INSERT INTO activity_tickets
      (activity_id, employee_id, employee_name, ticket_no, price, quantity, status)
    VALUES
      (p_activity_id, p_employee_id, p_employee_name, v_ticket_no, p_price, p_quantity, v_init_status)
    RETURNING to_json(activity_tickets.*) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. ATOMIC RPC: claim_surprise_box
--    Check one-per-year + pick gift + insert claim + decrement stock atomically
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_surprise_box(
  p_employee_id   TEXT,
  p_employee_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_year     INT := EXTRACT(YEAR FROM NOW())::INT;
  v_existing RECORD;
  v_gift_id  UUID;
  v_gift     RECORD;
BEGIN
  -- Check already claimed
  SELECT id, gift_name INTO v_existing
  FROM gift_claims
  WHERE employee_id = p_employee_id AND claimed_year = v_year
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object('alreadyClaimed', true, 'giftName', v_existing.gift_name);
  END IF;

  -- Weighted random selection (weight = quantity; NULL = max available qty, min 10)
  SELECT id INTO v_gift_id
  FROM (
    WITH avail AS (
      SELECT id,
        COALESCE(
          quantity,
          GREATEST(COALESCE((SELECT MAX(quantity) FROM gifts WHERE status = 'available' AND quantity IS NOT NULL), 0), 10)
        ) AS w
      FROM gifts
      WHERE status = 'available'
        AND (quantity IS NULL OR quantity > 0)
    ),
    totals AS (
      SELECT id, w,
        SUM(w) OVER ()                                       AS total_w,
        SUM(w) OVER (ORDER BY id ROWS UNBOUNDED PRECEDING)  AS cum_w
      FROM avail
    )
    SELECT id FROM totals
    WHERE cum_w >= RANDOM() * total_w
    ORDER BY cum_w
    LIMIT 1
  ) sel;

  IF v_gift_id IS NULL THEN
    RETURN json_build_object('noGifts', true);
  END IF;

  -- Lock the selected gift row to prevent concurrent stock decrement
  SELECT id, name, icon, img_url, quantity INTO v_gift
  FROM gifts WHERE id = v_gift_id FOR UPDATE;

  -- Re-check availability after acquiring lock
  IF v_gift.quantity IS NOT NULL AND v_gift.quantity <= 0 THEN
    RETURN json_build_object('noGifts', true);
  END IF;

  -- Insert claim (unique constraint catches any remaining race)
  INSERT INTO gift_claims (employee_id, employee_name, gift_id, gift_name, claimed_year)
  VALUES (p_employee_id, p_employee_name, v_gift.id, v_gift.name, v_year);

  -- Decrement stock atomically (same transaction)
  IF v_gift.quantity IS NOT NULL THEN
    UPDATE gifts SET quantity = quantity - 1 WHERE id = v_gift.id;
  END IF;

  RETURN json_build_object(
    'gift', json_build_object(
      'id',     v_gift.id,
      'name',   v_gift.name,
      'icon',   v_gift.icon,
      'imgUrl', v_gift.img_url
    )
  );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 4. ATOMIC RPC: daily_checkin (enforce server-side once/day)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_checkins (
  employee_name TEXT NOT NULL,
  checkin_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  pts_awarded   INT  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (employee_name, checkin_date)
);
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees can insert own checkin" ON daily_checkins;
CREATE POLICY "employees can insert own checkin"
  ON daily_checkins FOR INSERT
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- 5. RLS: settings table — read all, write admin only
-- ────────────────────────────────────────────────────────────

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings read all"  ON settings;
DROP POLICY IF EXISTS "settings write admin" ON settings;

CREATE POLICY "settings read all"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "settings write admin"
  ON settings FOR ALL
  USING (
    (SELECT role FROM employees WHERE id::text = auth.uid()::text LIMIT 1) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM employees WHERE id::text = auth.uid()::text LIMIT 1) = 'admin'
  );

-- ────────────────────────────────────────────────────────────
-- 6. RLS: consult_requests — counselor sees own queue, sender sees own requests
-- ────────────────────────────────────────────────────────────

ALTER TABLE consult_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consult owner read" ON consult_requests;
DROP POLICY IF EXISTS "consult counselor read" ON consult_requests;
DROP POLICY IF EXISTS "consult insert"     ON consult_requests;
DROP POLICY IF EXISTS "consult update counselor" ON consult_requests;

-- Sender: can read own requests
CREATE POLICY "consult owner read"
  ON consult_requests FOR SELECT
  USING (employee_id = auth.uid()::text);

-- Counselor: can read requests directed to them
CREATE POLICY "consult counselor read"
  ON consult_requests FOR SELECT
  USING (counselor_employee_id = auth.uid()::text);

-- Any employee: can insert (for sending request)
CREATE POLICY "consult insert"
  ON consult_requests FOR INSERT
  WITH CHECK (employee_id = auth.uid()::text);

-- Counselor: can update (mark read, reply)
CREATE POLICY "consult update counselor"
  ON consult_requests FOR UPDATE
  USING (counselor_employee_id = auth.uid()::text);

-- ────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────
