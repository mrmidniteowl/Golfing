-- Allow commissioners to insert and update hole scores for any round
CREATE POLICY "Commissioners can insert hole scores for any round"
  ON public.hole_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('commissioner', 'admin')
    )
  );

CREATE POLICY "Commissioners can update hole scores for any round"
  ON public.hole_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('commissioner', 'admin')
    )
  );
