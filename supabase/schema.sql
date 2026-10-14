-- MedRun Supabase schema. Run once in the Supabase SQL editor
-- (or `npx supabase db push` if you use the CLI with a linked project).
--
-- Money is stored as integer kobo. Timestamps are timestamptz; the app
-- reads/writes them as ISO-8601 strings. JSONB columns reuse the app's
-- domain shapes (see src/data/supabase/rows.ts).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- users
create table if not exists users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'patient'
    check (role in ('patient', 'pharmacy_admin', 'pharmacist', 'consultant')),
  display_name text not null,
  email text,
  phone_e164 text,
  photo_url text,
  locale text not null default 'en-NG',
  addresses jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------- pharmacies
create table if not exists pharmacies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pcn_license_number text not null,
  owner_id uuid not null references users (id),
  phone_e164 text not null,
  email text,
  address jsonb not null default '{}',
  latitude double precision not null,
  longitude double precision not null,
  geohash text not null default '',
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  is_active boolean not null default true,
  delivery_enabled boolean not null default true,
  pickup_enabled boolean not null default true,
  delivery_radius_km double precision not null default 8,
  rating_avg double precision not null default 0,
  review_count integer not null default 0,
  operating_hours jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pharmacy_staff (
  pharmacy_id uuid not null references pharmacies (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  role text not null check (role in ('admin', 'pharmacist')),
  invited_at timestamptz not null default now(),
  primary key (pharmacy_id, user_id)
);

-- --------------------------------------------- medicines and listings
create table if not exists medicines (
  id uuid primary key default gen_random_uuid(),
  generic_name text not null,
  brand_names text[] not null default '{}',
  form text not null,
  strength text not null default '',
  prescription_required boolean not null default false,
  nafdac_numbers text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references pharmacies (id) on delete cascade,
  medicine_id uuid not null references medicines (id),
  brand_name text not null,
  generic_name text not null,
  form text not null,
  strength text not null default '',
  nafdac_number text,
  pack_size text not null default '',
  quantity integer not null default 0,
  price_kobo bigint not null default 0,
  currency text not null default 'NGN',
  prescription_required boolean not null default false,
  expiry_date date,
  latitude double precision not null,
  longitude double precision not null,
  geohash text not null default '',
  state text not null default '',
  lga text not null default '',
  city text not null default '',
  is_available boolean not null default true,
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------- orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users (id),
  pharmacy_id uuid not null references pharmacies (id),
  items jsonb not null default '[]',
  subtotal_kobo bigint not null default 0,
  delivery_fee_kobo bigint not null default 0,
  total_kobo bigint not null default 0,
  currency text not null default 'NGN',
  fulfillment text not null check (fulfillment in ('delivery', 'pickup')),
  delivery_address jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery',
                      'ready_for_pickup', 'completed', 'cancelled')),
  payment jsonb not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------- consultations
create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users (id),
  consultant_id uuid references users (id),
  pharmacy_id uuid references pharmacies (id),
  channel text not null check (channel in ('chat', 'video', 'async')),
  status text not null default 'requested'
    check (status in ('requested', 'active', 'completed', 'cancelled')),
  chief_complaint text not null default '',
  prescription_issued boolean not null default false,
  related_order_id uuid references orders (id),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists consultation_messages (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations (id) on delete cascade,
  sender_id uuid not null references users (id),
  body text not null,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------- indexes
create index if not exists listings_pharmacy_id_idx on listings (pharmacy_id);
create index if not exists listings_available_idx on listings (is_available);
create index if not exists listings_geohash_idx on listings (geohash);
create index if not exists pharmacies_active_idx on pharmacies (is_active);
create index if not exists orders_patient_id_idx on orders (patient_id);
create index if not exists orders_pharmacy_id_idx on orders (pharmacy_id);
create index if not exists consultations_patient_id_idx on consultations (patient_id);
create index if not exists consultation_messages_consultation_id_idx
  on consultation_messages (consultation_id);

-- ------------------------------------------------------------------- RLS
-- DEV-ONLY permissive policies so the app works immediately with the anon
-- key. Tighten these before production (e.g. auth.uid() = owner_id checks,
-- patient-only order access, staff-only pharmacy writes).
alter table users enable row level security;
alter table pharmacies enable row level security;
alter table pharmacy_staff enable row level security;
alter table medicines enable row level security;
alter table listings enable row level security;
alter table orders enable row level security;
alter table consultations enable row level security;
alter table consultation_messages enable row level security;

create policy "dev: all access" on users for all using (true) with check (true);
create policy "dev: all access" on pharmacies for all using (true) with check (true);
create policy "dev: all access" on pharmacy_staff for all using (true) with check (true);
create policy "dev: all access" on medicines for all using (true) with check (true);
create policy "dev: all access" on listings for all using (true) with check (true);
create policy "dev: all access" on orders for all using (true) with check (true);
create policy "dev: all access" on consultations for all using (true) with check (true);
create policy "dev: all access" on consultation_messages for all using (true) with check (true);
