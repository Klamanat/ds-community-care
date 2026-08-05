-- ============================================================
-- Phase 4 — Real Authentication
-- DS Community Care
-- Run this on Supabase SQL Editor
-- Enables: signInWithPassword, get_my_employee(), link_auth_user()
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Add auth_user_id to employees table
--    Links Supabase auth.users → employees row
-- ────────────────────────────────────────────────────────────

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS employees_auth_user_id_idx
  ON employees (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 2. RPC: get_my_employee
--    Returns own employee row using auth.uid() — called on app start
--    after session restore to get authoritative role/dept/name
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_employee()
RETURNS TABLE (
  id              TEXT,
  emp_code        TEXT,
  name            TEXT,
  role            TEXT,
  dept            TEXT,
  img_url         TEXT,
  img_id          TEXT,
  star_gang_slogan TEXT,
  in_team         BOOLEAN,
  bd_date         TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id::TEXT, emp_code, name, role, dept,
    img_url, img_id, star_gang_slogan, in_team,
    COALESCE(bd_date::TEXT, '') AS bd_date
  FROM employees
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION get_my_employee() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_my_employee() TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 3. RPC: link_auth_user
--    Called after signUp to link the new Supabase auth user
--    to the employee record (only if not already linked)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION link_auth_user(p_emp_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE employees
  SET auth_user_id = auth.uid()
  WHERE emp_code = p_emp_code
    AND auth_user_id IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION link_auth_user(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION link_auth_user(TEXT) TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 4. Helper: check_has_auth_user
--    Client calls this to know whether to use signInWithPassword
--    (has Supabase user) or legacy bcrypt path (needs migration)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_has_auth_user(p_emp_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth_user_id IS NOT NULL
  FROM employees
  WHERE emp_code = p_emp_code
  LIMIT 1;
$$;

-- Allow anonymous callers (needed during login before session)
REVOKE ALL ON FUNCTION check_has_auth_user(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_has_auth_user(TEXT) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────
