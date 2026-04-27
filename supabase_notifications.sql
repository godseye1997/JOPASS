-- Run this in Supabase → SQL Editor

-- Add viewed_by_owner column to bookings
alter table public.bookings
  add column if not exists viewed_by_owner boolean not null default false;

-- Allow owners to mark their own vendor's bookings as viewed
create policy "Owner mark bookings viewed" on public.bookings
  for update using (
    vendor_id in (
      select vendor_id from public.profiles where id = auth.uid()
    )
  )
  with check (
    vendor_id in (
      select vendor_id from public.profiles where id = auth.uid()
    )
  );

-- Enable realtime for bookings table (run once)
alter publication supabase_realtime add table public.bookings;
