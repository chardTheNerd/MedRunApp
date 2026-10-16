-- MedRun pharmacy reviews. Run once in the Supabase Dashboard:
-- SQL Editor -> New query -> paste -> Run (or `npx supabase db push` if you
-- use the CLI with a linked project).
--
-- Requires policies.sql (v2) to have been run first (uses is_admin()).
-- Re-runnable: table/index use IF NOT EXISTS, function uses CREATE OR
-- REPLACE, trigger and policies are dropped first.
--
-- The refresh trigger keeps pharmacies.rating_avg / review_count in sync on
-- every insert, rating update, or delete — the app never writes aggregates.
--
-- Verify afterwards:
--   select count(*) from public.pharmacy_reviews;
--   select policyname from pg_policies
--    where schemaname = 'public' and tablename = 'pharmacy_reviews';

create table if not exists public.pharmacy_reviews (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  patient_id uuid not null references public.users (id),
  author_name text not null default '',
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pharmacy_reviews_pharmacy_idx
  on public.pharmacy_reviews (pharmacy_id);

-- One review per patient per pharmacy: backs the app's upsert.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pharmacy_reviews_patient_unique'
  ) then
    alter table public.pharmacy_reviews
      add constraint pharmacy_reviews_patient_unique unique (pharmacy_id, patient_id);
  end if;
end $$;

-- ============ Aggregate trigger ============

create or replace function public.refresh_pharmacy_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update public.pharmacies p
    set rating_avg = coalesce(
          (select avg(rating)::double precision from public.pharmacy_reviews where pharmacy_id = old.pharmacy_id), 0),
        review_count = coalesce(
          (select count(*) from public.pharmacy_reviews where pharmacy_id = old.pharmacy_id), 0),
        updated_at = now()
    where p.id = old.pharmacy_id;
    return old;
  else
    update public.pharmacies p
    set rating_avg = coalesce(
          (select avg(rating)::double precision from public.pharmacy_reviews where pharmacy_id = new.pharmacy_id), 0),
        review_count = coalesce(
          (select count(*) from public.pharmacy_reviews where pharmacy_id = new.pharmacy_id), 0),
        updated_at = now()
    where p.id = new.pharmacy_id;
    return new;
  end if;
end;
$$;

drop trigger if exists refresh_pharmacy_rating on public.pharmacy_reviews;
create trigger refresh_pharmacy_rating
  after insert or update of rating or delete on public.pharmacy_reviews
  for each row execute function public.refresh_pharmacy_rating();

-- ============ RLS (mirrors the catalog model: public read, owner write) ============

alter table public.pharmacy_reviews enable row level security;

drop policy if exists "reviews: public read" on public.pharmacy_reviews;
create policy "reviews: public read" on public.pharmacy_reviews
  for select using (true);

drop policy if exists "reviews: patient create" on public.pharmacy_reviews;
create policy "reviews: patient create" on public.pharmacy_reviews
  for insert to authenticated with check (patient_id = auth.uid());

drop policy if exists "reviews: patient update" on public.pharmacy_reviews;
create policy "reviews: patient update" on public.pharmacy_reviews
  for update to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

drop policy if exists "reviews: admin delete" on public.pharmacy_reviews;
create policy "reviews: admin delete" on public.pharmacy_reviews
  for delete to authenticated using (is_admin());
