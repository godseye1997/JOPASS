-- ================================================================
-- JoPass — Supabase Setup Script
-- Paste this entire file into Supabase → SQL Editor → Run
-- ================================================================

-- ── Vendors ──────────────────────────────────────────────────────
create table if not exists public.vendors (
  id          bigint primary key,
  name        text not null,
  category    text not null,
  description text,
  image       text,
  color       text,
  icon        text
);

-- ── Services ─────────────────────────────────────────────────────
create table if not exists public.services (
  id            bigint primary key,
  vendor_id     bigint references public.vendors(id) on delete cascade,
  name          text not null,
  duration      text,
  price         numeric(10,2) not null,
  jopass_price  numeric(10,2) not null,
  credits       int not null
);

-- ── Openings ─────────────────────────────────────────────────────
create table if not exists public.openings (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      bigint references public.vendors(id) on delete cascade,
  service_name   text not null,
  duration       text,
  original_price numeric(10,2) not null,
  jopass_price   numeric(10,2) not null,
  credits        int not null,
  capacity       int not null default 1,
  date           date not null,
  slots          text[] not null default '{}',
  booked_slots   text[] not null default '{}',
  created_at     timestamptz default now()
);

-- ── Profiles (extends auth.users) ────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  email       text,
  role        text not null default 'customer',  -- customer | owner | admin
  vendor_id   bigint references public.vendors(id),
  credits     int not null default 0,
  created_at  timestamptz default now()
);

-- ── Bookings ─────────────────────────────────────────────────────
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  vendor_id        bigint references public.vendors(id),
  service_name     text not null,
  service_credits  int not null default 0,
  service_price    numeric(10,2) not null default 0,
  original_price   numeric(10,2) not null default 0,
  date             date not null,
  time             text not null,
  status           text not null default 'confirmed',  -- confirmed | completed | cancelled
  created_at       timestamptz default now()
);

-- ── Reviews ──────────────────────────────────────────────────────
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references public.bookings(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  vendor_id   bigint references public.vendors(id),
  rating      int not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz default now()
);

-- ── Vendor Profiles ───────────────────────────────────────────────
create table if not exists public.vendor_profiles (
  vendor_id          bigint primary key references public.vendors(id) on delete cascade,
  logo_url           text,
  about              text,
  phone              text,
  website            text,
  instagram          text,
  facebook           text,
  whatsapp           text,
  twitter            text,
  amenities          text[] default '{}',
  photos             text[] default '{}',
  location_address   text,
  location_lat       numeric(10,7),
  location_lng       numeric(10,7),
  updated_at         timestamptz default now()
);

-- ── Credit Transactions ───────────────────────────────────────────
create table if not exists public.credit_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  amount      int not null,           -- positive = purchase, negative = spend
  type        text not null,          -- purchase | booking | refund | cancellation
  description text,
  created_at  timestamptz default now()
);


-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

alter table public.vendors           enable row level security;
alter table public.services          enable row level security;
alter table public.openings          enable row level security;
alter table public.profiles          enable row level security;
alter table public.bookings          enable row level security;
alter table public.reviews           enable row level security;
alter table public.vendor_profiles   enable row level security;
alter table public.credit_transactions enable row level security;

-- Vendors & services: anyone can read
create policy "Public read vendors"  on public.vendors  for select using (true);
create policy "Public read services" on public.services for select using (true);
create policy "Public read openings" on public.openings for select using (true);
create policy "Public read vendor_profiles" on public.vendor_profiles for select using (true);
create policy "Public read reviews"  on public.reviews  for select using (true);

-- Owners can insert/update/delete their own vendor data
create policy "Owner manage services" on public.services
  for all using (
    vendor_id in (
      select vendor_id from public.profiles where id = auth.uid()
    )
  );

create policy "Owner manage openings" on public.openings
  for all using (
    vendor_id in (
      select vendor_id from public.profiles where id = auth.uid()
    )
  );

create policy "Owner manage vendor_profile" on public.vendor_profiles
  for all using (
    vendor_id in (
      select vendor_id from public.profiles where id = auth.uid()
    )
  );

-- Profiles: users manage their own
create policy "Users read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Bookings: users see and manage their own
create policy "Users read own bookings"   on public.bookings for select using (auth.uid() = user_id);
create policy "Users insert own bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "Users update own bookings" on public.bookings for update using (auth.uid() = user_id);

-- Owners can read bookings for their venue
create policy "Owners read venue bookings" on public.bookings
  for select using (
    vendor_id in (
      select vendor_id from public.profiles where id = auth.uid()
    )
  );

-- Reviews: users manage their own
create policy "Users insert own reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users update own reviews" on public.reviews for update using (auth.uid() = user_id);

-- Credit transactions: users see their own
create policy "Users read own transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);
create policy "Users insert own transactions" on public.credit_transactions
  for insert with check (auth.uid() = user_id);


-- ================================================================
-- AUTO-CREATE PROFILE ON SIGN UP
-- ================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ================================================================
-- SEED VENDOR DATA (from existing app data)
-- ================================================================

insert into public.vendors (id, name, category, description, image, color, icon) values
  (1, 'FitZone Gym',       'Sports Activities',    'Full-access gym sessions with top-tier equipment and personal trainers.',         'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop', '#e17055', '🏋️'),
  (2, 'Luxe Hair Studio',  'Beauty and Wellness',  'Premium hair styling and treatment services at discounted rates.',                 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=300&fit=crop', '#fd79a8', '💇'),
  (3, 'Tranquil Touch Spa','Health and Wellness',  'Relaxing massage therapy sessions to melt away stress.',                          'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=300&fit=crop', '#00b894', '💆'),
  (4, 'Glow Beauty Bar',   'Beauty and Wellness',  'Facials, manicures, and beauty treatments to look your best.',                   'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=300&fit=crop', '#e84393', '✨'),
  (5, 'Peak Performance',  'Sports Activities',    'Rock climbing, functional training, and fitness classes.',                        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=300&fit=crop', '#0984e3', '🧗'),
  (6, 'Serenity Wellness', 'Health and Wellness',  'Holistic wellness treatments combining massage and meditation.',                   'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&h=300&fit=crop', '#6c5ce7', '🧘'),
  (7, 'Iron Temple',       'Sports Activities',    'Hardcore training facility for serious lifters and athletes.',                    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop', '#2d3436', '💪'),
  (8, 'The Nail Room',     'Beauty and Wellness',  'Nail art, pedicures, and hand treatments by expert technicians.',                'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=300&fit=crop', '#fab1a0', '💅')
on conflict (id) do nothing;

-- credits = jopass_price (1 credit = 1 JOD)
insert into public.services (id, vendor_id, name, duration, price, jopass_price, credits) values
  (101, 1, 'Open Gym Session',    '60 min',  5,  3,  3),
  (102, 1, 'Group HIIT Class',    '45 min',  7,  4,  4),
  (103, 1, 'Personal Training',   '60 min',  14, 8,  8),
  (201, 2, 'Haircut & Style',     '45 min',  9,  5,  5),
  (202, 2, 'Color Treatment',     '90 min',  18, 10, 10),
  (203, 2, 'Blowout',             '30 min',  6,  3,  3),
  (301, 3, 'Swedish Massage',     '60 min',  11, 6,  6),
  (302, 3, 'Deep Tissue Massage', '60 min',  14, 8,  8),
  (303, 3, 'Hot Stone Therapy',   '75 min',  17, 10, 10),
  (401, 4, 'Express Facial',      '30 min',  7,  4,  4),
  (402, 4, 'Gel Manicure',        '40 min',  5,  3,  3),
  (403, 4, 'Full Glam Makeup',    '60 min',  12, 7,  7),
  (501, 5, 'Climbing Session',    '90 min',  9,  5,  5),
  (502, 5, 'CrossFit Class',      '60 min',  7,  4,  4),
  (503, 5, 'Yoga Flow',           '60 min',  5,  3,  3),
  (601, 6, 'Aromatherapy Massage','60 min',  12, 7,  7),
  (602, 6, 'Reflexology',         '45 min',  9,  5,  5),
  (603, 6, 'Couples Massage',     '75 min',  24, 14, 14),
  (701, 7, 'Open Gym Access',     '120 min', 4,  2,  2),
  (702, 7, 'Powerlifting Coach',  '60 min',  18, 10, 10),
  (703, 7, 'Boxing Class',        '60 min',  8,  5,  5),
  (801, 8, 'Classic Manicure',    '30 min',  4,  2,  2),
  (802, 8, 'Spa Pedicure',        '45 min',  7,  4,  4),
  (803, 8, 'Nail Art Set',        '60 min',  10, 6,  6)
on conflict (id) do nothing;
