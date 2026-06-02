-- Add nine_hole_only flag to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS nine_hole_only boolean NOT NULL DEFAULT false;

-- Add Pine Acres Country Club (9-hole only course)
INSERT INTO public.courses (name, city, state, par, hole_pars, nine_hole_only, lat, lng)
VALUES (
  'Pine Acres Country Club',
  'Bradford',
  'PA',
  36,
  '{4,4,3,5,4,5,3,4,4}',
  true,
  41.9548,
  -78.6436
);
