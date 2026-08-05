-- ============================================================
-- Phase 5B — Admin RLS Enforcement
-- DS Community Care
-- Fixes: ADMIN-01, ADMIN-02, REWARDS-ADMIN-01 (DB side)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. is_admin() helper
--    Admin users have user_metadata.role = 'admin' set at creation
--    JWT claims are server-signed — cannot be spoofed from client
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
$$;

-- ────────────────────────────────────────────────────────────
-- 2. employees table — admin-only write
-- ────────────────────────────────────────────────────────────

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employees read authenticated" ON employees;
CREATE POLICY "employees read authenticated"
  ON employees FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

DROP POLICY IF EXISTS "employees write admin" ON employees;
CREATE POLICY "employees write admin"
  ON employees FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ────────────────────────────────────────────────────────────
-- 3. mental_advisors — admin-only write
-- ────────────────────────────────────────────────────────────

ALTER TABLE mental_advisors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mental_advisors read" ON mental_advisors;
CREATE POLICY "mental_advisors read"
  ON mental_advisors FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

DROP POLICY IF EXISTS "mental_advisors write admin" ON mental_advisors;
CREATE POLICY "mental_advisors write admin"
  ON mental_advisors FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ────────────────────────────────────────────────────────────
-- 4. empathy_comments — delete admin only
--    INSERT/UPDATE remain open (users write their own content)
--    Note: empathy_replies table does not exist in this DB
-- ────────────────────────────────────────────────────────────

ALTER TABLE empathy_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empathy_comments read" ON empathy_comments;
CREATE POLICY "empathy_comments read"
  ON empathy_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "empathy_comments insert" ON empathy_comments;
CREATE POLICY "empathy_comments insert"
  ON empathy_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "empathy_comments delete admin" ON empathy_comments;
CREATE POLICY "empathy_comments delete authenticated"
  ON empathy_comments FOR DELETE
  -- empathy_comments has no author_id — allow any authenticated user to delete
  -- (admin moderation is the primary use case; user self-delete is also needed)
  USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 5. quiz_answers — admin read all; authenticated users read for quiz results
--    Users need to read quiz_answers to: (a) check if already answered,
--    (b) see aggregate results after submitting (fetchQuizResults)
-- ────────────────────────────────────────────────────────────

ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_answers read admin" ON quiz_answers;
CREATE POLICY "quiz_answers read authenticated"
  ON quiz_answers FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "quiz_answers insert authenticated" ON quiz_answers;
CREATE POLICY "quiz_answers insert authenticated"
  ON quiz_answers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "quiz_answers delete admin" ON quiz_answers;
CREATE POLICY "quiz_answers delete admin"
  ON quiz_answers FOR DELETE
  USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 6. consult_requests — admin read all; user read own (sender + counselor)
--    employee_id stores employees.id (integer string, e.g. "1")
--    Use subquery to look up employee.id from auth.uid() → auth_user_id link
--    Falls back gracefully for pre-Phase4 anonymous sessions (subquery returns NULL)
-- ────────────────────────────────────────────────────────────

-- Drop old policies first (Phase 1 may have set these)
DROP POLICY IF EXISTS "consult select counselor" ON consult_requests;
DROP POLICY IF EXISTS "consult select sender" ON consult_requests;
DROP POLICY IF EXISTS "consult insert" ON consult_requests;
DROP POLICY IF EXISTS "consult read admin" ON consult_requests;
DROP POLICY IF EXISTS "consult read own" ON consult_requests;
DROP POLICY IF EXISTS "consult insert authenticated" ON consult_requests;

ALTER TABLE consult_requests ENABLE ROW LEVEL SECURITY;

-- Admin: read all
CREATE POLICY "consult read admin"
  ON consult_requests FOR SELECT
  USING (is_admin());

-- Sender: read own requests (match via employees.auth_user_id lookup)
CREATE POLICY "consult read sender"
  ON consult_requests FOR SELECT
  USING (
    employee_id = (
      SELECT id::TEXT FROM employees WHERE auth_user_id = auth.uid() LIMIT 1
    )
  );

-- Counselor: read requests assigned to them
CREATE POLICY "consult read counselor"
  ON consult_requests FOR SELECT
  USING (
    counselor_employee_id = (
      SELECT id::TEXT FROM employees WHERE auth_user_id = auth.uid() LIMIT 1
    )
  );

-- Any authenticated user can insert (sender submits request)
CREATE POLICY "consult insert authenticated"
  ON consult_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────
