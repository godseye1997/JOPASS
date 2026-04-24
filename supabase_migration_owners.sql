-- Run this in Supabase SQL Editor

-- Allow vendors table to auto-generate IDs for new owners
create sequence if not exists vendors_id_seq start with 100;
alter table public.vendors alter column id set default nextval('vendors_id_seq');

-- Update approved_owners: remove vendor dependency, add phone
alter table public.approved_owners drop column if exists vendor_id;
alter table public.approved_owners add column if not exists phone text;

-- Allow profiles vendor_id to be set after signup
alter table public.profiles alter column vendor_id drop not null;
