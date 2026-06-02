-- Add Irish Waters Golf Club, Freedom, WI
INSERT INTO public.courses (name, city, state, par, hole_pars, lat, lng)
VALUES (
  'Irish Waters Golf Club',
  'Freedom',
  'WI',
  71,
  '{4,4,5,3,4,4,4,3,4,4,4,3,5,3,4,4,4,5}',
  44.4283,
  -88.2706
)
ON CONFLICT (name) DO NOTHING;

grant select, insert, update, delete on public.courses to authenticated;
grant select on public.courses to anon;
