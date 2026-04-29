-- Create a teams table so commissioners can manage team names from the UI
-- instead of requiring a code change for each new team.
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are viewable by everyone"
  ON public.teams FOR SELECT USING (true);

CREATE POLICY "Commissioners can manage teams"
  ON public.teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('commissioner', 'admin')
    )
  );

-- Seed existing team names
INSERT INTO public.teams (name) VALUES ('Wisconsin Knights'), ('Test');
