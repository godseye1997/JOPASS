-- Run in Supabase → SQL Editor

-- Add blocked_slots to services table
-- Stores entries as "YYYY-MM-DD|HH:MM AM" e.g. "2026-04-28|10:00 AM"
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS blocked_slots text[] NOT NULL DEFAULT '{}';

-- Allow owners to update their own services (drop first if exists)
DROP POLICY IF EXISTS "Owner update services" ON public.services;
CREATE POLICY "Owner update services" ON public.services
  FOR UPDATE USING (
    vendor_id IN (
      SELECT vendor_id FROM public.profiles WHERE id = auth.uid()
    )
  );
