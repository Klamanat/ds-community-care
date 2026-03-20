-- 032_quiz_answers.sql
-- Table for storing user answers to announcement quiz/polls

CREATE TABLE IF NOT EXISTS quiz_answers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ann_id        text        NOT NULL,
  employee_name text        NOT NULL,
  selected      text[]      NOT NULL DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  UNIQUE(ann_id, employee_name)
);

ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Anyone can read (to show result counts)
CREATE POLICY "quiz_answers_select" ON quiz_answers
  FOR SELECT USING (true);

-- Anyone can insert their answer
CREATE POLICY "quiz_answers_insert" ON quiz_answers
  FOR INSERT WITH CHECK (true);

-- Allow updating own answer (upsert)
CREATE POLICY "quiz_answers_update" ON quiz_answers
  FOR UPDATE USING (true);
