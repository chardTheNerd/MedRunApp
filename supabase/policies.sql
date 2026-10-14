-- MedRun RLS policies (v2). Run AFTER schema.sql in the Supabase SQL editor.
-- Re-runnable: every policy/trigger is dropped first.
--
-- Model:
--   * Sign-up uses Supabase email confirmation. The handle_new_user trigger
--     creates the public.users row server-side on auth.users insert, so the
--     client never needs elevated rights and RLS stays enforced everywhere.
--     Signup metadata can only ever yield role 'patient'; promotion to
--     pharmacy_admin / pharmacist / consultant is an admin UPDATE (or SQL).
--   * Catalog (pharmacies, medicines, listings): public read so patients can
--     browse; writes restricted to pharmacy owners/staff, EXCEPT pharmacies
--     themselves: only admins onboard (INSERT) and deboard (DELETE, or
--     preferred soft-deboard via is_active = false). Members may update
--     day-to-day fields; verification_status/is_active changes are
--     admin-only in the app layer.
--   * Users: signed-in read; insert own row as 'patient'; update own row
--     (role column guarded by trigger); admins may update any row.
--   * Orders/consultations/messages: participants only.
--
-- Bootstrap the first admin (run as postgres / via Table Editor SQL):
--   update users set role = 'pharmacy_admin' where email = 'admin@example.com';

-- ------------------------------------------------------- helper functions
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from users u where u.id = auth.uid() and u.role = 'pharmacy_admin'
  );
$$;

create or replace function is_pharmacy_member(pharmacy uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from pharmacies p
    where p.id = pharmacy and p.owner_id = auth.uid()
  ) or exists (
    select 1 from pharmacy_staff s
    where s.pharmacy_id = pharmacy and s.user_id = auth.uid()
  );
$$;

create or replace function is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from pharmacy_staff s where s.user_id = auth.uid()
  );
$$;

-- --------------------------------- signup trigger (server-side, no RLS bypass for clients)
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, role, display_name, email, phone_e164, photo_url, locale, addresses)
  values (
    new.id,
    'patient',
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    null,
    'en-NG',
    '[]'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- --------------------------------- role guard: only admins can change roles
create or replace function protect_user_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_role on users;
create trigger protect_user_role
  before update on users
  for each row execute function protect_user_role();

-- ------------------------------------------------------------------ users
drop policy if exists "dev: all access" on users;
drop policy if exists "users: signed-in read" on users;
drop policy if exists "users: insert own profile" on users;
drop policy if exists "users: update own profile" on users;
create policy "users: signed-in read" on users
  for select to authenticated using (true);
create policy "users: insert own profile" on users
  for insert to authenticated
  with check (id = auth.uid() and (role = 'patient' or is_admin()));
create policy "users: update own profile" on users
  for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- ------------------------------------------------------------- pharmacies
drop policy if exists "dev: all access" on pharmacies;
drop policy if exists "pharmacies: public read" on pharmacies;
drop policy if exists "pharmacies: owner create" on pharmacies;
drop policy if exists "pharmacies: member update" on pharmacies;
drop policy if exists "pharmacies: owner delete" on pharmacies;
create policy "pharmacies: public read" on pharmacies
  for select using (true);
create policy "pharmacies: admin onboard" on pharmacies
  for insert to authenticated with check (is_admin());
create policy "pharmacies: admin or member update" on pharmacies
  for update to authenticated
  using (is_admin() or is_pharmacy_member(id))
  with check (is_admin() or is_pharmacy_member(id));
create policy "pharmacies: admin deboard" on pharmacies
  for delete to authenticated using (is_admin());

drop policy if exists "dev: all access" on pharmacy_staff;
drop policy if exists "staff: member read" on pharmacy_staff;
drop policy if exists "staff: member manage" on pharmacy_staff;
drop policy if exists "staff: member update" on pharmacy_staff;
drop policy if exists "staff: member remove" on pharmacy_staff;
create policy "staff: member read" on pharmacy_staff
  for select to authenticated
  using (is_admin() or is_pharmacy_member(pharmacy_id));
create policy "staff: member manage" on pharmacy_staff
  for insert to authenticated
  with check (is_admin() or is_pharmacy_member(pharmacy_id));
create policy "staff: member update" on pharmacy_staff
  for update to authenticated
  using (is_admin() or is_pharmacy_member(pharmacy_id))
  with check (is_admin() or is_pharmacy_member(pharmacy_id));
create policy "staff: member remove" on pharmacy_staff
  for delete to authenticated
  using (is_admin() or is_pharmacy_member(pharmacy_id));

-- -------------------------------------------- medicines and listings
drop policy if exists "dev: all access" on medicines;
drop policy if exists "medicines: public read" on medicines;
drop policy if exists "medicines: staff write" on medicines;
drop policy if exists "medicines: staff update" on medicines;
create policy "medicines: public read" on medicines
  for select using (true);
create policy "medicines: staff write" on medicines
  for insert to authenticated with check (is_staff() or is_admin());
create policy "medicines: staff update" on medicines
  for update to authenticated
  using (is_staff() or is_admin()) with check (is_staff() or is_admin());
create policy "medicines: admin delete" on medicines
  for delete to authenticated using (is_admin());

drop policy if exists "dev: all access" on listings;
drop policy if exists "listings: public read" on listings;
drop policy if exists "listings: member create" on listings;
drop policy if exists "listings: member update" on listings;
drop policy if exists "listings: member delete" on listings;
create policy "listings: public read" on listings
  for select using (true);
create policy "listings: member create" on listings
  for insert to authenticated
  with check (is_admin() or is_pharmacy_member(pharmacy_id));
create policy "listings: member update" on listings
  for update to authenticated
  using (is_admin() or is_pharmacy_member(pharmacy_id))
  with check (is_admin() or is_pharmacy_member(pharmacy_id));
create policy "listings: member delete" on listings
  for delete to authenticated
  using (is_admin() or is_pharmacy_member(pharmacy_id));

-- ----------------------------------------------------------------- orders
drop policy if exists "dev: all access" on orders;
drop policy if exists "orders: participant read" on orders;
drop policy if exists "orders: patient create" on orders;
drop policy if exists "orders: participant update" on orders;
create policy "orders: participant read" on orders
  for select to authenticated
  using (patient_id = auth.uid() or is_pharmacy_member(pharmacy_id));
create policy "orders: patient create" on orders
  for insert to authenticated with check (patient_id = auth.uid());
create policy "orders: participant update" on orders
  for update to authenticated
  using (patient_id = auth.uid() or is_pharmacy_member(pharmacy_id))
  with check (patient_id = auth.uid() or is_pharmacy_member(pharmacy_id));

-- ----------------------------------------------------------- consultations
drop policy if exists "dev: all access" on consultations;
drop policy if exists "consultations: participant read" on consultations;
drop policy if exists "consultations: patient create" on consultations;
drop policy if exists "consultations: participant update" on consultations;
create policy "consultations: participant read" on consultations
  for select to authenticated
  using (patient_id = auth.uid() or consultant_id = auth.uid());
create policy "consultations: patient create" on consultations
  for insert to authenticated with check (patient_id = auth.uid());
create policy "consultations: participant update" on consultations
  for update to authenticated
  using (patient_id = auth.uid() or consultant_id = auth.uid())
  with check (patient_id = auth.uid() or consultant_id = auth.uid());

drop policy if exists "dev: all access" on consultation_messages;
drop policy if exists "messages: participant read" on consultation_messages;
drop policy if exists "messages: participant send" on consultation_messages;
create policy "messages: participant read" on consultation_messages
  for select to authenticated using (
    exists (
      select 1 from consultations c
      where c.id = consultation_id
        and (c.patient_id = auth.uid() or c.consultant_id = auth.uid())
    )
  );
create policy "messages: participant send" on consultation_messages
  for insert to authenticated with check (
    sender_id = auth.uid() and exists (
      select 1 from consultations c
      where c.id = consultation_id
        and (c.patient_id = auth.uid() or c.consultant_id = auth.uid())
    )
  );
