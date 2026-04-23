-- =============================================
-- Migration 003: Round entry fields for League vs Non-League play
-- =============================================
-- Adds columns to `rounds` to support the new round-entry flow:
--   play_mode       - 'league' or 'non_league'; used to separate statistics
--   league_id_night - which league + night (e.g., 'PGC.Thursday'); league only
--   team_name       - player's team for the night (e.g., 'Wisconsin Knights')
--   nine_side       - 'front' or 'back'; required when hole_count = 9
--   hole_count      - 9 or 18; drives handicap target (36 for 9, 72 for 18)
--
-- Existing rows get safe defaults:
--   play_mode='non_league', hole_count=18, everything else NULL.
-- Any existing round that was actually a 9-hole round will need manual
-- correction (see note in PR 3 description).
--
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kujakaketkyarfrhpwva/sql
--
-- Safe to re-run: all additions use IF NOT EXISTS / DROP+CREATE patterns.
-- =============================================

-- 1. Add the columns with defaults so existing rows satisfy NOT NULLs
ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS play_mode TEXT NOT NULL DEFAULT 'non_league',
  ADD COLUMN IF NOT EXISTS league_id_night TEXT,
  ADD COLUMN IF NOT EXISTS team_name TEXT,
  ADD COLUMN IF NOT EXISTS nine_side TEXT,
  ADD COLUMN IF NOT EXISTS hole_count INTEGER NOT NULL DEFAULT 18;

-- 2. Value-set check constraints
ALTER TABLE public.rounds DROP CONSTRAINT IF EXISTS rounds_play_mode_check;
ALTER TABLE public.rounds
  ADD CONSTRAINT rounds_play_mode_check
  CHECK (play_mode IN ('league', 'non_league'));

ALTER TABLE public.rounds DROP CONSTRAINT IF EXISTS rounds_nine_side_check;
ALTER TABLE public.rounds
  ADD CONSTRAINT rounds_nine_side_check
  CHECK (nine_side IS NULL OR nine_side IN ('front', 'back'));

ALTER TABLE public.rounds DROP CONSTRAINT IF EXISTS rounds_hole_count_check;
ALTER TABLE public.rounds
  ADD CONSTRAINT rounds_hole_count_check
  CHECK (hole_count IN (9, 18));

-- 3. Business-rule constraints
--    League rounds must specify league_id_night + team_name and are always 9 holes.
ALTER TABLE public.rounds DROP CONSTRAINT IF EXISTS rounds_league_fields_check;
ALTER TABLE public.rounds
  ADD CONSTRAINT rounds_league_fields_check
  CHECK (
    (play_mode = 'league'
      AND league_id_night IS NOT NULL
      AND team_name IS NOT NULL
      AND hole_count = 9)
    OR play_mode = 'non_league'
  );

--    9-hole rounds must specify which nine; 18-hole rounds must not.
ALTER TABLE public.rounds DROP CONSTRAINT IF EXISTS rounds_nine_side_required_check;
ALTER TABLE public.rounds
  ADD CONSTRAINT rounds_nine_side_required_check
  CHECK (
    (hole_count = 9 AND nine_side IS NOT NULL)
    OR (hole_count = 18 AND nine_side IS NULL)
  );

-- 4. Index for stats queries that filter by play_mode (used by PR 5)
CREATE INDEX IF NOT EXISTS idx_rounds_play_mode ON public.rounds(play_mode);
