-- ============================================================
-- Phase 5C — Empathy Like Security
-- DS Community Care
-- Fixes: EMPATHY-01
--
-- RPCs now derive user identity from auth.uid() (Phase 4 sessions)
-- Falls back to p_user_key for anonymous/pre-migration sessions
-- Backward compatible — existing like data unchanged
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. toggle_empathy_like — server-verified user identity
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION toggle_empathy_like(p_post_id TEXT, p_user_key TEXT)
RETURNS TABLE (liked BOOLEAN, like_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_key TEXT;
  v_exists        BOOLEAN;
BEGIN
  -- Phase 4: use auth.uid() → look up employee id (verified, not client-supplied)
  -- Falls back to p_user_key for anonymous/pre-migration sessions
  SELECT id::TEXT INTO v_effective_key
  FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;

  v_effective_key := COALESCE(v_effective_key, NULLIF(p_user_key, ''), 'anonymous');

  SELECT EXISTS(
    SELECT 1 FROM empathy_likes WHERE post_id = p_post_id AND user_key = v_effective_key
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM empathy_likes WHERE post_id = p_post_id AND user_key = v_effective_key;
  ELSE
    INSERT INTO empathy_likes (post_id, user_key) VALUES (p_post_id, v_effective_key)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY
    SELECT NOT v_exists, COUNT(*) FROM empathy_likes WHERE post_id = p_post_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 2. toggle_comment_like — server-verified user identity
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id TEXT, p_user_key TEXT)
RETURNS TABLE (liked BOOLEAN, like_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_key TEXT;
  v_exists        BOOLEAN;
BEGIN
  SELECT id::TEXT INTO v_effective_key
  FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;

  v_effective_key := COALESCE(v_effective_key, NULLIF(p_user_key, ''), 'anonymous');

  SELECT EXISTS(
    SELECT 1 FROM comment_likes WHERE comment_id = p_comment_id AND user_key = v_effective_key
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM comment_likes WHERE comment_id = p_comment_id AND user_key = v_effective_key;
  ELSE
    INSERT INTO comment_likes (comment_id, user_key) VALUES (p_comment_id, v_effective_key)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY
    SELECT NOT v_exists, COUNT(*) FROM comment_likes WHERE comment_id = p_comment_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. toggle_channel_like — server-verified user identity
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION toggle_channel_like(p_channel_id TEXT, p_user_key TEXT)
RETURNS TABLE (liked BOOLEAN, like_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_key TEXT;
  v_exists        BOOLEAN;
BEGIN
  SELECT id::TEXT INTO v_effective_key
  FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;

  v_effective_key := COALESCE(v_effective_key, NULLIF(p_user_key, ''), 'anonymous');

  SELECT EXISTS(
    SELECT 1 FROM channel_likes WHERE channel_id = p_channel_id AND user_key = v_effective_key
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM channel_likes WHERE channel_id = p_channel_id AND user_key = v_effective_key;
  ELSE
    INSERT INTO channel_likes (channel_id, user_key) VALUES (p_channel_id, v_effective_key)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY
    SELECT NOT v_exists, COUNT(*) FROM channel_likes WHERE channel_id = p_channel_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────
