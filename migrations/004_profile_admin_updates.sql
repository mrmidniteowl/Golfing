-- =============================================
-- Migration 004: Commissioner/admin can update any profile
-- =============================================
-- Lets a user with role 'commissioner' or 'admin' update any profile row
-- (e.g., to correct a player's full_name from the Commissioner Panel).
-- The existing "Users can update own profile" policy stays in place, so
-- regular players can still edit their own profile. UPDATE policies
-- union together (OR), so either policy passing allows the update.
--
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kujakaketkyarfrhpwva/sql
--
-- Safe to re-run: DROP + CREATE pattern.
-- =============================================

DROP POLICY IF EXISTS "Commissioners can update any profile" ON public.profiles;
CREATE POLICY "Commissioners can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('commissioner', 'admin')
    )
  );
