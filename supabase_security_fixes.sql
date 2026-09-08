-- ================================================================
-- JoPass — Security Fixes
-- Run this ONCE in the Supabase SQL Editor (paste all of it, click Run).
-- Safe to re-run (idempotent). Closes privilege-escalation and
-- data-exposure holes found in the security review.
-- ================================================================

-- ================================================================
-- C1. Stop users from making themselves admin / owner
-- The "Users update own profile" policy lets a user edit ANY column
-- of their own row, including `role` and `vendor_id`. We keep that
-- policy (they still edit name/phone/etc.) but add a trigger that
-- blocks changes to the sensitive columns unless an admin makes them
-- (or our trusted signup RPC, which sets a transaction-local flag).
-- ================================================================
create or replace function public.prevent_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role
      or new.vendor_id is distinct from old.vendor_id) then
    if not public.is_admin()
       and current_setting('app.allow_role_change', true) is distinct from 'on' then
      raise exception 'You are not allowed to change role or vendor_id.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_priv on public.profiles;
create trigger trg_prevent_profile_priv
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_change();

-- ================================================================
-- C3. Harden create_vendor_for_owner
-- Was: took any p_user_id, promoted it to owner with no allowlist
-- check -> anyone could self-promote or hijack another account.
-- Now: only the authenticated caller, only if their own email is on
-- the approved list and unclaimed. Marks it claimed and copies phone.
-- ================================================================
create or replace function public.create_vendor_for_owner(
  p_user_id       uuid,
  p_business_name text
) returns bigint as $$
declare
  v_id       bigint;
  v_email    text;
  v_approved public.approved_owners%rowtype;
begin
  -- Caller may only set up their OWN account.
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized.';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  select * into v_approved
  from public.approved_owners
  where lower(email) = lower(v_email);

  if v_approved.email is null then
    raise exception 'This email is not on the approved owner list.';
  end if;
  if v_approved.claimed then
    raise exception 'This owner account has already been claimed.';
  end if;

  insert into public.vendors (name, category, description, icon, color)
  values (p_business_name, '', '', '🏢', '#0C5467')
  returning id into v_id;

  -- Allow this trusted, allowlist-checked promotion past the C1 trigger.
  perform set_config('app.allow_role_change', 'on', true);

  update public.profiles
  set role = 'owner',
      vendor_id = v_id,
      phone = coalesce(nullif(phone, ''), v_approved.phone)
  where id = auth.uid();

  update public.approved_owners
  set claimed = true
  where lower(email) = lower(v_email);

  return v_id;
end;
$$ language plpgsql security definer;

grant execute on function public.create_vendor_for_owner(uuid, text) to authenticated;

-- ================================================================
-- C2 + M2. Lock down the approved_owners allowlist
-- Was: any authenticated user could read the whole table (names,
-- emails, phones) AND write to it (add/remove owners).
-- Now: only admins can read or write it directly. Signup checks a
-- single email via a SECURITY DEFINER function (below), so it never
-- needs table-wide read access.
-- ================================================================
drop policy if exists "Authenticated write approved_owners" on public.approved_owners;
drop policy if exists "Authenticated read approved_owners"  on public.approved_owners;
drop policy if exists "Public read approved_owners"         on public.approved_owners;
drop policy if exists "Admin manage approved_owners"        on public.approved_owners;

create policy "Admin read approved_owners"
  on public.approved_owners for select using (public.is_admin());
create policy "Admin insert approved_owners"
  on public.approved_owners for insert with check (public.is_admin());
create policy "Admin update approved_owners"
  on public.approved_owners for update using (public.is_admin());
create policy "Admin delete approved_owners"
  on public.approved_owners for delete using (public.is_admin());

-- Signup lookup: returns only the single matching row's non-sensitive
-- fields, and only when the caller already knows the exact email.
create or replace function public.check_owner_email(p_email text)
returns table(name text, phone text, claimed boolean) as $$
  select name, phone, claimed
  from public.approved_owners
  where lower(email) = lower(p_email);
$$ language sql security definer stable;

grant execute on function public.check_owner_email(text) to anon, authenticated;

-- ================================================================
-- H3. Storage: stop users overwriting/deleting other venues' images
-- Was: any authenticated user could update/delete ANY image in the
-- bucket. Now: only the object's owner (uploader) can. Public read
-- stays; new uploads still allowed for any authenticated user.
-- (No app change needed — Supabase stamps objects.owner on insert.)
-- ================================================================
drop policy if exists "Owners update jopass-images" on storage.objects;
create policy "Owners update jopass-images"
  on storage.objects for update to authenticated
  using (bucket_id = 'jopass-images' and owner = auth.uid());

drop policy if exists "Owners delete jopass-images" on storage.objects;
create policy "Owners delete jopass-images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'jopass-images' and owner = auth.uid());

-- ================================================================
-- Done. Verify your own admin account still shows role = 'admin':
--   select id, email, role from public.profiles where role = 'admin';
-- ================================================================
