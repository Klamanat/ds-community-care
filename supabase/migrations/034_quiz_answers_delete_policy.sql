-- 034_quiz_answers_delete_policy.sql
-- Allow admin users to delete quiz answers (for Reset function)

CREATE POLICY "quiz_answers_delete" ON quiz_answers
  FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
