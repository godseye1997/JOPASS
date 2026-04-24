-- Run this in Supabase SQL Editor

-- Set your account as admin
update public.profiles
set role = 'admin'
where email = 'hijaziyazeed@gmail.com';

-- Verify it worked
select id, email, role from public.profiles where email = 'hijaziyazeed@gmail.com';

-- Also simplify approved_owners policy as a fallback
-- Allow any authenticated user to read approved_owners
drop policy if exists "Public read approved_owners" on public.approved_owners;
create policy "Public read approved_owners"
  on public.approved_owners for select using (true);

-- Allow authenticated admin to write (uses our is_admin() function)
drop policy if exists "Admin manage approved_owners" on public.approved_owners;
create policy "Admin insert approved_owners"
  on public.approved_owners for insert
  with check (public.is_admin());

create policy "Admin update approved_owners"
  on public.approved_owners for update
  using (public.is_admin());

create policy "Admin delete approved_owners"
  on public.approved_owners for delete
  using (public.is_admin());
