-- MedRun initial schema. Matches src/data/supabase/rows.ts.
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
-- RLS policies below are MVP-permissive (any signed-in user). Tighten before production.

-- ============ Tables ============

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'patient',
  display_name text not null default '',
  email text,
  phone_e164 text,
  photo_url text,
  locale text not null default 'en-NG',
  addresses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pcn_license_number text not null,
  owner_id uuid not null references public.users (id),
  phone_e164 text not null default '',
  email text,
  address jsonb not null default '{}'::jsonb,
  latitude double precision not null default 0,
  longitude double precision not null default 0,
  geohash text not null default '',
  verification_status text not null default 'pending',
  is_active boolean not null default true,
  delivery_enabled boolean not null default true,
  pickup_enabled boolean not null default true,
  delivery_radius_km numeric not null default 8,
  rating_avg numeric not null default 0,
  review_count integer not null default 0,
  operating_hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pharmacy_staff (
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'pharmacist',
  invited_at timestamptz not null default now(),
  primary key (pharmacy_id, user_id)
);

create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  generic_name text not null,
  brand_names text[] not null default '{}',
  form text,
  strength text,
  prescription_required boolean not null default false,
  nafdac_numbers text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  medicine_id uuid not null references public.medicines (id) on delete restrict,
  brand_name text not null default '',
  generic_name text not null default '',
  form text,
  strength text,
  nafdac_number text,
  pack_size text,
  quantity integer not null default 0,
  price_kobo bigint not null default 0,
  currency text not null default 'NGN',
  prescription_required boolean not null default false,
  expiry_date timestamptz,
  latitude double precision not null default 0,
  longitude double precision not null default 0,
  geohash text not null default '',
  state text,
  lga text,
  city text,
  is_available boolean not null default true,
  updated_at timestamptz not null default now()
);
create index if not exists listings_pharmacy_idx on public.listings (pharmacy_id);
create index if not exists listings_geohash_idx on public.listings (geohash);
create index if not exists listings_generic_idx on public.listings (generic_name);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users (id),
  pharmacy_id uuid not null references public.pharmacies (id),
  items jsonb not null default '[]'::jsonb,
  subtotal_kobo bigint not null default 0,
  delivery_fee_kobo bigint not null default 0,
  total_kobo bigint not null default 0,
  currency text not null default 'NGN',
  fulfillment text not null default 'delivery',
  delivery_address jsonb,
  status text not null default 'pending',
  payment jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_patient_idx on public.orders (patient_id);
create index if not exists orders_pharmacy_idx on public.orders (pharmacy_id);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users (id),
  consultant_id uuid references public.users (id),
  pharmacy_id uuid references public.pharmacies (id),
  channel text not null default 'chat',
  status text not null default 'requested',
  chief_complaint text not null default '',
  prescription_issued boolean not null default false,
  related_order_id uuid references public.orders (id),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists consultations_patient_idx on public.consultations (patient_id);

create table if not exists public.consultation_messages (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations (id) on delete cascade,
  sender_id uuid not null references public.users (id),
  body text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists consultation_messages_consultation_idx
  on public.consultation_messages (consultation_id);

-- ============ Auto-create profile on signup ============
-- The app's auth connector expects this trigger: after signup it reads the
-- profile row immediately (or backfills it when email confirmation is off).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, role, display_name, email, phone_e164)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'patient'),
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RLS (MVP-permissive: any signed-in user) ============

alter table public.users enable row level security;
alter table public.pharmacies enable row level security;
alter table public.pharmacy_staff enable row level security;
alter table public.medicines enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.consultations enable row level security;
alter table public.consultation_messages enable row level security;

-- Users manage their own profile; anyone signed in can read profiles
-- (needed so pharmacies/consultants can resolve names).
create policy "users_read_all" on public.users for select to authenticated using (true);
create policy "users_insert_own" on public.users for insert to authenticated with check (auth.uid() = id);
create policy "users_update_own" on public.users for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Pharmacies / staff / medicines / listings: signed-in read + write for MVP.
create policy "pharmacies_all" on public.pharmacies for all to authenticated using (true) with check (true);
create policy "staff_all" on public.pharmacy_staff for all to authenticated using (true) with check (true);
create policy "medicines_all" on public.medicines for all to authenticated using (true) with check (true);
create policy "listings_all" on public.listings for all to authenticated using (true) with check (true);

-- Orders: patients see their own; pharmacy reads need a staff check (added pre-production).
create policy "orders_patient_read" on public.orders for select to authenticated
  using (auth.uid() = patient_id);
create policy "orders_insert" on public.orders for insert to authenticated
  with check (auth.uid() = patient_id);
create policy "orders_patient_update" on public.orders for update to authenticated
  using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

-- Consultations + messages: patient or assigned consultant.
create policy "consultations_participant_read" on public.consultations for select to authenticated
  using (auth.uid() = patient_id or auth.uid() = consultant_id);
create policy "consultations_patient_insert" on public.consultations for insert to authenticated
  with check (auth.uid() = patient_id);
create policy "consultations_participant_update" on public.consultations for update to authenticated
  using (auth.uid() = patient_id or auth.uid() = consultant_id);
create policy "messages_participant" on public.consultation_messages for all to authenticated
  using (
    exists (
      select 1 from public.consultations c
      where c.id = consultation_id and (c.patient_id = auth.uid() or c.consultant_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.consultations c
      where c.id = consultation_id and (c.patient_id = auth.uid() or c.consultant_id = auth.uid())
    )
  );
