-- Correct Patriot Golf Club hole pars: hole 5 -> par 4, hole 6 -> par 5
UPDATE public.courses
SET hole_pars = '{4,3,4,4,4,5,3,5,4,4,4,3,4,5,5,3,4,4}'
WHERE name = 'The Patriot Golf Club';
