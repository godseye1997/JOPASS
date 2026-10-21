-- ================================================================
-- JoPass — Record vendor acceptance of the Vendor Terms & Conditions
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- Adds two columns to profiles that the signup page fills in when a
-- vendor ticks "I agree to the Vendor Terms & Conditions".
-- (Table-level UPDATE grant already covers new columns; the C1
-- privilege trigger ignores these non-sensitive columns.)
-- ================================================================
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version     text;

-- See who has accepted, and which version:
--   select email, terms_version, terms_accepted_at
--   from public.profiles
--   where role = 'owner'
--   order by terms_accepted_at desc nulls last;
