-- Add cleared_by_customer flag to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cleared_by_customer boolean NOT NULL DEFAULT false;
