-- Run this in Supabase SQL Editor

-- Helper function that checks admin role, bypasses RLS
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Drop the old broken policy on approved_owners
drop policy if exists "Admin manage approved_owners" on public.approved_owners;

-- Replace with one that uses the helper function
create policy "Admin manage approved_owners"
  on public.approved_owners for all
  using (public.is_admin())
  with check (public.is_admin());

-- Also fix the same issue on other tables that check admin role
drop policy if exists "Owner manage services" on public.services;
drop policy if exists "Owner manage openings" on public.openings;
drop policy if exists "Owner manage vendor_profile" on public.vendor_profiles;

-- Helper for owner check too
create or replace function public.is_owner_of(vid bigint)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and vendor_id = vid
  );
$$ language sql security definer stable;

create policy "Owner manage services"
  on public.services for all
  using (public.is_owner_of(vendor_id));

create policy "Owner manage openings"
  on public.openings for all
  using (public.is_owner_of(vendor_id));

create policy "Owner manage vendor_profile"
  on public.vendor_profiles for all
  using (public.is_owner_of(vendor_id));

-- Allow authenticated users to read all profiles (needed internally)
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Allow owners to read bookings for their venue
drop policy if exists "Owners read venue bookings" on public.bookings;
create policy "Owners read venue bookings"
  on public.bookings for select
  using (public.is_owner_of(vendor_id) or auth.uid() = user_id);
