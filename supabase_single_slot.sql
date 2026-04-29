-- Run in Supabase → SQL Editor
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS single_slot boolean NOT NULL DEFAULT false;
