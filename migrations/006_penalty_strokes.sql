-- Add penalty_strokes to hole_scores for tracking penalty strokes per hole.
-- Penalty strokes are for tracking only; the player's total_score already
-- includes them since scores are entered as-played.
ALTER TABLE public.hole_scores
  ADD COLUMN penalty_strokes integer NOT NULL DEFAULT 0;
