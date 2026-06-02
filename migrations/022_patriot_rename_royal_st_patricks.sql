-- Rename Patriot Golf Club to sort first in the course list
UPDATE public.courses
SET name = '1. Patriot Golf Club'
WHERE name = 'Patriot Golf Club';

-- Add Royal St. Patrick's Golf Links, Wrightstown, WI
INSERT INTO public.courses (name, city, state, par, hole_pars, nine_hole_only, lat, lng)
VALUES (
  'Royal St. Patrick''s Golf Links',
  'Wrightstown',
  'WI',
  72,
  '{4,4,5,3,4,4,5,3,4,4,4,3,4,5,3,4,5,4}',
  false,
  44.3233,
  -88.1656
);
