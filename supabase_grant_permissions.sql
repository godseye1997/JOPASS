-- Run this in Supabase SQL Editor

-- Grant table-level access to authenticated and anon roles
grant select, insert, update, delete on public.approved_owners to authenticated;
grant select                          on public.approved_owners to anon;

grant select, insert, update, delete on public.vendors          to authenticated;
grant select                          on public.vendors          to anon;

grant select, insert, update, delete on public.services         to authenticated;
grant select                          on public.services         to anon;

grant select, insert, update, delete on public.openings         to authenticated;
grant select                          on public.openings         to anon;

grant select, insert, update, delete on public.profiles         to authenticated;

grant select, insert, update, delete on public.bookings         to authenticated;

grant select, insert, update, delete on public.reviews          to authenticated;
grant select                          on public.reviews          to anon;

grant select, insert, update, delete on public.vendor_profiles  to authenticated;
grant select                          on public.vendor_profiles  to anon;

grant select, insert, update, delete on public.credit_transactions to authenticated;

-- Grant usage on the vendors id sequence so new vendors can be inserted
grant usage, select on sequence vendors_id_seq to authenticated;
