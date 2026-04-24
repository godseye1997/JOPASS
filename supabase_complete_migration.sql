-- ================================================================
-- JoPass — Complete Migration SQL
-- Run this in Supabase SQL Editor AFTER supabase_setup.sql
-- and after supabase_fix_rls.sql
-- ================================================================

-- ── Auto-increment for services table ──────────────────────────
create sequence if not exists services_id_seq start 1000;
alter table public.services alter column id set default nextval('services_id_seq');
grant usage, select on sequence services_id_seq to authenticated;

-- ── RPC: atomically append a slot to booked_slots ──────────────
create or replace function public.append_booked_slot(opening_id uuid, slot_time text)
returns void as $$
  update public.openings
  set booked_slots = array_append(booked_slots, slot_time)
  where id = opening_id;
$$ language sql security definer;

grant execute on function public.append_booked_slot(uuid, text) to authenticated;

-- ── RPC: create vendor row + link to owner profile atomically ───
-- Called from owner-signup.html so owner can insert into vendors
-- even though they don't have vendor_id yet (RLS would block direct insert)
create or replace function public.create_vendor_for_owner(
  p_user_id      uuid,
  p_business_name text
) returns bigint as $$
declare
  v_id bigint;
begin
  insert into public.vendors (name, category, description, icon, color)
  values (p_business_name, '', '', '🏢', '#0C5467')
  returning id into v_id;

  update public.profiles
  set role = 'owner', vendor_id = v_id
  where id = p_user_id;

  return v_id;
end;
$$ language plpgsql security definer;

grant execute on function public.create_vendor_for_owner(uuid, text) to authenticated;

-- ── Policy: owners can update their own vendor row ──────────────
drop policy if exists "Owner update own vendor" on public.vendors;
create policy "Owner update own vendor" on public.vendors
  for update using (public.is_owner_of(id));

-- ── Policy: admins can manage all vendors ──────────────────────
drop policy if exists "Admin manage vendors" on public.vendors;
create policy "Admin manage vendors" on public.vendors
  for all using (public.is_admin());

-- ── Policy: owners can read all profiles (to show customer names) ──
drop policy if exists "Owners read all profiles" on public.profiles;
create policy "Owners read all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid() and p2.role in ('owner', 'admin')
    )
  );

-- ── Policy: admin can update any booking (e.g. cancel) ─────────
drop policy if exists "Admin manage bookings" on public.bookings;
create policy "Admin manage bookings" on public.bookings
  for all using (public.is_admin());

-- ── Policy: owners can update bookings for their venue ─────────
drop policy if exists "Owners update venue bookings" on public.bookings;
create policy "Owners update venue bookings" on public.bookings
  for update using (public.is_owner_of(vendor_id));

-- ── Make approved_owners readable by everyone (for signup check) ─
drop policy if exists "Authenticated read approved_owners" on public.approved_owners;
create policy "Authenticated read approved_owners"
  on public.approved_owners for select using (true);
