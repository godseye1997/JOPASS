-- Run this in Supabase SQL Editor

-- Drop all existing policies on approved_owners
drop policy if exists "Public read approved_owners"        on public.approved_owners;
drop policy if exists "Admin manage approved_owners"       on public.approved_owners;
drop policy if exists "Admin insert approved_owners"       on public.approved_owners;
drop policy if exists "Admin update approved_owners"       on public.approved_owners;
drop policy if exists "Admin delete approved_owners"       on public.approved_owners;

-- Simple policies: authenticated users can do everything
-- (admin-only enforcement is handled in the app)
create policy "Authenticated read approved_owners"
  on public.approved_owners for select
  using (true);

create policy "Authenticated write approved_owners"
  on public.approved_owners for all
  to authenticated
  using (true)
  with check (true);
