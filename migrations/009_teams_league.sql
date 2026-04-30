-- Associate teams with a specific league night
ALTER TABLE public.teams ADD COLUMN league_id_night text NOT NULL DEFAULT 'PGC.Thursday';

-- Update the existing seed rows to the default league
UPDATE public.teams SET league_id_night = 'PGC.Thursday';
