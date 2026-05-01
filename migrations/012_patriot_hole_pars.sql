-- Correct Patriot Golf Club hole pars: hole 5 → par 5, hole 16 → par 3
UPDATE public.courses
SET hole_pars = '[4,3,4,4,5,4,3,5,4,4,4,3,4,5,5,3,4,4]'
WHERE name = 'The Patriot Golf Club';
