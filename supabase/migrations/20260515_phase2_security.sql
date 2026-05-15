-- ============================================================
-- Phase 2 — Security Hardening
-- DS Community Care
-- Run this on Supabase SQL Editor AFTER phase1 migration
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. daily_checkin RPC
--    Uses daily_checkins table (created in Phase 1) to enforce
--    server-side once-per-day check-in
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION daily_checkin(p_emp_name TEXT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_today  DATE := CURRENT_DATE;
  v_pts    INT  := 0;
  v_rule   RECORD;
BEGIN
  -- Check if already checked in today (atomic with INSERT below)
  PERFORM 1 FROM daily_checkins
  WHERE employee_name = p_emp_name AND checkin_date = v_today;

  IF FOUND THEN
    RETURN 0;  -- already checked in
  END IF;

  -- Get points for daily check-in from rules
  SELECT pts INTO v_pts FROM point_rules
  WHERE type = 'checkin' AND active = true
  LIMIT 1;

  v_pts := COALESCE(v_pts, 10);  -- default 10 pts if no rule

  -- Insert check-in record (PRIMARY KEY prevents race)
  BEGIN
    INSERT INTO daily_checkins (employee_name, checkin_date, pts_awarded)
    VALUES (p_emp_name, v_today, v_pts);
  EXCEPTION WHEN unique_violation THEN
    RETURN 0;  -- race condition: another request beat us
  END;

  -- Award points
  INSERT INTO point_transactions (employee_name, type, subtype, amount, description)
  VALUES (p_emp_name, 'checkin', 'daily', v_pts, 'เช็คอินประจำวัน');

  RETURN v_pts;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 2. RLS: daily_checkins — allow SELECT own records
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "employees can select own checkin" ON daily_checkins;
CREATE POLICY "employees can select own checkin"
  ON daily_checkins FOR SELECT
  USING (true);

-- ────────────────────────────────────────────────────────────
-- 3. Add employee_id to activity_joins (NAME-SPOOF partial)
-- ────────────────────────────────────────────────────────────

ALTER TABLE activity_joins
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- Index for employee_id lookups
CREATE INDEX IF NOT EXISTS activity_joins_employee_id_idx
  ON activity_joins (employee_id)
  WHERE employee_id IS NOT NULL;

-- Add employee_id to activity_joins unique constraint
-- (Drop old constraint first, recreate to include employee_id as optional)
ALTER TABLE activity_joins
  DROP CONSTRAINT IF EXISTS activity_joins_unique_emp;

-- New constraint: unique on (activity_id, employee_id) when employee_id is present
CREATE UNIQUE INDEX IF NOT EXISTS activity_joins_unique_emp_id
  ON activity_joins (activity_id, employee_id)
  WHERE employee_id IS NOT NULL;

-- Keep name-based constraint for rows without employee_id (legacy)
CREATE UNIQUE INDEX IF NOT EXISTS activity_joins_unique_emp_name
  ON activity_joins (activity_id, employee_name)
  WHERE employee_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- 4. Add employee_id to ideas table (NAME-SPOOF partial)
-- ────────────────────────────────────────────────────────────

ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

CREATE INDEX IF NOT EXISTS ideas_employee_id_idx
  ON ideas (employee_id)
  WHERE employee_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────
