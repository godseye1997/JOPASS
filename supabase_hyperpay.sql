-- ================================================================
-- JoPass — HyperPay payment support
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ================================================================

-- Tracks a payment attempt from "checkout prepared" to "booking created".
-- Written only by the server-side Edge Function (service role); RLS is on
-- with no policies, so customers cannot read or tamper with it.
create table if not exists public.payment_intents (
  id           uuid primary key default gen_random_uuid(),
  checkout_id  text unique,
  merchant_tx  text,
  user_id      uuid,
  opening_id   uuid,
  slot         text,
  vendor_id    bigint,
  amount       text,
  status       text default 'created',   -- created | done
  booking_id   uuid,
  created_at   timestamptz default now()
);
alter table public.payment_intents enable row level security;

-- The Edge Function runs as the signed-in user, so let a user manage
-- only their own payment rows.
grant select, insert, update on public.payment_intents to authenticated;
drop policy if exists "Own payment intents" on public.payment_intents;
create policy "Own payment intents" on public.payment_intents
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Links a booking to the payment that created it (idempotency + proof).
alter table public.bookings add column if not exists payment_ref text;
