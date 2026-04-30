-- Add total_penalties aggregate column to rounds for stats display
ALTER TABLE public.rounds ADD COLUMN total_penalties integer NOT NULL DEFAULT 0;
