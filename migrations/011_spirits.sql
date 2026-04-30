-- Track spirits consumed per round as an aggregate on the rounds table
ALTER TABLE public.rounds ADD COLUMN total_spirits integer NOT NULL DEFAULT 0;
