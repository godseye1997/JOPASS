-- JoPass — settle/payout tracking for the admin Financials tab
-- Run once in the Supabase SQL Editor. Safe to re-run.
alter table public.bookings add column if not exists settled_at timestamptz;
