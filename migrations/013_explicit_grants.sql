-- Explicit grants for all public tables (Supabase Data API change, effective Oct 30)
-- New tables created after this must include similar grants in their migration.

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.rounds to authenticated;
grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.hole_scores to authenticated;
grant select, insert, update, delete on public.leagues to authenticated;
grant select, insert, update, delete on public.league_members to authenticated;
grant select, insert, update, delete on public.teams to authenticated;

-- anon role gets read-only access to courses
grant select on public.courses to anon;
