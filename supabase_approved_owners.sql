-- Run this in Supabase SQL Editor

create table if not exists public.approved_owners (
  email      text primary key,
  vendor_id  bigint references public.vendors(id),
  name       text,
  claimed    boolean default false,
  created_at timestamptz default now()
);

alter table public.approved_owners enable row level security;

-- Anyone can read (needed for email check during signup, no sensitive data)
create policy "Public read approved_owners"
  on public.approved_owners for select using (true);

-- Only admin can insert/update/delete (enforced in app by role check)
create policy "Admin manage approved_owners"
  on public.approved_owners for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
