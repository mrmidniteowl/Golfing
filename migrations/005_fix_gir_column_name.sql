-- The hole_scores table was created with the column named "Green in Regulation"
-- (with spaces) instead of the intended snake_case name "gir".
-- All app code already references the column as "gir", so GIR data has never
-- been saved or read correctly. This rename aligns the DB with the code.
ALTER TABLE public.hole_scores
  RENAME COLUMN "Green in Regulation" TO gir;
