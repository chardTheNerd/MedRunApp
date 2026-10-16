-- MedRun dev seed: sample pharmacies, medicines, and listings in Lagos.
--
-- Run AFTER supabase/migrations/0001_initial_schema.sql AND
-- supabase/migrations/0004_pharmacy_reviews.sql, in the Supabase
-- Dashboard: SQL Editor -> New query -> paste -> Run (runs as postgres,
-- which bypasses RLS). Safe to re-run: inserts are idempotent on fixed ids.
--
-- Prerequisite: at least one user must have signed up in the app first.
-- The Auth trigger creates their public.users row, and the script assigns
-- them as owner of the sample pharmacies. If nobody has signed up yet the
-- script stops with a clear error instead of writing orphan rows.
--
-- Verify afterwards:
--   select count(*) from public.pharmacies;   -- expect 4
--   select count(*) from public.medicines;    -- expect 10
--   select count(*) from public.listings where is_available;  -- expect 13
--   select count(*) from public.pharmacy_reviews;
--     -- expect 9 with 3 test users, 4 with 1 user, 7 with 2 users
--     -- (slot 1 always seeds: one review per pharmacy)
--
-- All names, licence numbers, and phone numbers below are fictional sample
-- data for development only.

do $$
declare
  seed_owner uuid;
  reviewers uuid[];
begin
  select u.id into seed_owner from public.users u order by u.created_at limit 1;
  if seed_owner is null then
    raise exception 'No users found. Sign up in the app first, then re-run this seed.';
  end if;

  -- ============ Pharmacies ============

  insert into public.pharmacies (
    id, owner_id, name, pcn_license_number, phone_e164, email,
    address, latitude, longitude, geohash,
    verification_status, is_active,
    delivery_enabled, pickup_enabled, delivery_radius_km,
    rating_avg, review_count, operating_hours
  ) values
  (
    'a1111111-1111-4111-8111-111111111111', seed_owner,
    'Lifecare Pharmacy Yaba', 'PCN/LAG/2021/00482', '+2348012345678', 'hello@lifecare-yaba.example.ng',
    '{"street":"12 Commercial Avenue","city":"Yaba","lga":"Lagos Mainland","state":"Lagos","country":"NG"}',
    6.5105, 3.3792, '',
    'verified', true, true, true, 10,
    4.6, 128,
    '{"mon":{"open":"08:00","close":"22:00"},"tue":{"open":"08:00","close":"22:00"},"wed":{"open":"08:00","close":"22:00"},"thu":{"open":"08:00","close":"22:00"},"fri":{"open":"08:00","close":"22:00"},"sat":{"open":"09:00","close":"21:00"},"sun":{"open":"12:00","close":"18:00"}}'
  ),
  (
    'a2222222-2222-4222-8222-222222222222', seed_owner,
    'Wellness Point Pharmacy Ikeja', 'PCN/LAG/2019/01137', '+2348098765432', 'care@wellnesspoint-ikeja.example.ng',
    '{"street":"45 Allen Avenue","city":"Ikeja","lga":"Ikeja","state":"Lagos","country":"NG"}',
    6.6018, 3.3515, '',
    'verified', true, true, true, 8,
    4.3, 86,
    '{"mon":{"open":"08:00","close":"21:00"},"tue":{"open":"08:00","close":"21:00"},"wed":{"open":"08:00","close":"21:00"},"thu":{"open":"08:00","close":"21:00"},"fri":{"open":"08:00","close":"21:00"},"sat":{"open":"09:00","close":"20:00"},"sun":null}'
  ),
  (
    'a3333333-3333-4333-8333-333333333333', seed_owner,
    'Carehub Pharmacy Surulere', 'PCN/LAG/2022/00719', '+2348055512346', 'hello@carehub-surulere.example.ng',
    '{"street":"7 Adelabu Street","city":"Surulere","lga":"Surulere","state":"Lagos","country":"NG"}',
    6.4975, 3.3581, '',
    'verified', true, true, true, 8,
    4.5, 64,
    '{"mon":{"open":"07:30","close":"22:30"},"tue":{"open":"07:30","close":"22:30"},"wed":{"open":"07:30","close":"22:30"},"thu":{"open":"07:30","close":"22:30"},"fri":{"open":"07:30","close":"22:30"},"sat":{"open":"08:00","close":"22:00"},"sun":{"open":"12:00","close":"20:00"}}'
  ),
  (
    'a4444444-4444-4444-8444-444444444444', seed_owner,
    'Island Meds Pharmacy Lekki', 'PCN/LAG/2020/00963', '+2348077788899', 'orders@islandmeds-lekki.example.ng',
    '{"street":"21 Admiralty Way","city":"Lekki Phase 1","lga":"Eti-Osa","state":"Lagos","country":"NG"}',
    6.4474, 3.4712, '',
    'verified', true, true, true, 15,
    4.8, 203,
    '{"mon":{"open":"08:00","close":"23:00"},"tue":{"open":"08:00","close":"23:00"},"wed":{"open":"08:00","close":"23:00"},"thu":{"open":"08:00","close":"23:00"},"fri":{"open":"08:00","close":"23:00"},"sat":{"open":"08:00","close":"23:00"},"sun":{"open":"10:00","close":"22:00"}}'
  )
  on conflict (id) do update set
    owner_id = excluded.owner_id,
    name = excluded.name,
    pcn_license_number = excluded.pcn_license_number,
    phone_e164 = excluded.phone_e164,
    email = excluded.email,
    address = excluded.address,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    verification_status = excluded.verification_status,
    is_active = excluded.is_active,
    delivery_enabled = excluded.delivery_enabled,
    pickup_enabled = excluded.pickup_enabled,
    delivery_radius_km = excluded.delivery_radius_km,
    rating_avg = excluded.rating_avg,
    review_count = excluded.review_count,
    operating_hours = excluded.operating_hours,
    updated_at = now();

  -- ============ Medicines ============

  insert into public.medicines (
    id, generic_name, brand_names, form, strength,
    prescription_required, nafdac_numbers
  ) values
  (
    'b1111111-1111-4111-8111-111111111111',
    'paracetamol', '{"Panadol","Emzor Paracetamol"}', 'tablet', '500mg',
    false, '{"04-0876"}'
  ),
  (
    'b2222222-2222-4222-8222-222222222222',
    'paracetamol', '{"Panadol","Emzor Paracetamol"}', 'syrup', '120mg/5ml',
    false, '{"04-0877"}'
  ),
  (
    'b3333333-3333-4333-8333-333333333333',
    'amoxicillin', '{"Amoxil","Fidson Amoxicillin"}', 'capsule', '500mg',
    true, '{"04-2210"}'
  ),
  (
    'b4444444-4444-4444-8444-444444444444',
    'co-amoxiclav', '{"Augmentin","Amoxiclav"}', 'tablet', '625mg',
    true, '{"04-3354"}'
  ),
  (
    'b5555555-5555-4555-8555-555555555555',
    'metronidazole', '{"Flagyl"}', 'tablet', '400mg',
    false, '{"04-1120"}'
  ),
  (
    'b6666666-6666-4666-8666-666666666666',
    'artemether/lumefantrine', '{"Coartem","Lonart"}', 'tablet', '20mg/120mg',
    false, '{"04-5541"}'
  ),
  (
    'b7777777-7777-4777-8777-777777777777',
    'salbutamol', '{"Ventolin"}', 'inhaler', '100mcg',
    true, '{"04-7788"}'
  ),
  (
    'b8888888-8888-4888-8888-888888888888',
    'ibuprofen', '{"Brufen"}', 'tablet', '400mg',
    false, '{"04-9902"}'
  ),
  (
    'b9999999-9999-4999-8999-999999999999',
    'ciprofloxacin', '{"Ciprotab"}', 'tablet', '500mg',
    true, '{"04-4417"}'
  ),
  (
    'b0000000-0000-4000-8000-000000000000',
    'oral rehydration salts', '{"Electral"}', 'other', 'sachet',
    false, '{"04-6630"}'
  )
  on conflict (id) do update set
    generic_name = excluded.generic_name,
    brand_names = excluded.brand_names,
    form = excluded.form,
    strength = excluded.strength,
    prescription_required = excluded.prescription_required,
    nafdac_numbers = excluded.nafdac_numbers,
    updated_at = now();

  -- ============ Listings (prices in kobo) ============

  insert into public.listings (
    id, pharmacy_id, medicine_id,
    brand_name, generic_name, form, strength, nafdac_number, pack_size,
    quantity, price_kobo, currency, prescription_required,
    expiry_date, latitude, longitude, geohash,
    state, lga, city, is_available
  ) values
  -- Panadol tablets at two pharmacies: brand + price comparison for "paracetamol".
  (
    'c1111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111111',
    'Panadol', 'paracetamol', 'tablet', '500mg', '04-0876', 'x20 tabs',
    240, 120000, 'NGN', false,
    now() + interval '540 days', 6.5105, 3.3792, '',
    'Lagos', 'Lagos Mainland', 'Yaba', true
  ),
  (
    'c2222222-2222-4222-8222-222222222222',
    'a2222222-2222-4222-8222-222222222222', 'b1111111-1111-4111-8111-111111111111',
    'Emzor Paracetamol', 'paracetamol', 'tablet', '500mg', '04-0876', 'x20 tabs',
    500, 85000, 'NGN', false,
    now() + interval '480 days', 6.6018, 3.3515, '',
    'Lagos', 'Ikeja', 'Ikeja', true
  ),
  -- Augmentin vs generic co-amoxiclav.
  (
    'c3333333-3333-4333-8333-333333333333',
    'a1111111-1111-4111-8111-111111111111', 'b4444444-4444-4444-8444-444444444444',
    'Augmentin', 'co-amoxiclav', 'tablet', '625mg', '04-3354', 'x14 tabs',
    60, 850000, 'NGN', true,
    now() + interval '400 days', 6.5105, 3.3792, '',
    'Lagos', 'Lagos Mainland', 'Yaba', true
  ),
  (
    'c4444444-4444-4444-8444-444444444444',
    'a3333333-3333-4333-8333-333333333333', 'b4444444-4444-4444-8444-444444444444',
    'Amoxiclav', 'co-amoxiclav', 'tablet', '625mg', '04-3354', 'x14 tabs',
    40, 690000, 'NGN', true,
    now() + interval '390 days', 6.4975, 3.3581, '',
    'Lagos', 'Surulere', 'Surulere', true
  ),
  -- Antimalarials: Coartem vs Lonart.
  (
    'c5555555-5555-4555-8555-555555555555',
    'a2222222-2222-4222-8222-222222222222', 'b6666666-6666-4666-8666-666666666666',
    'Coartem', 'artemether/lumefantrine', 'tablet', '20mg/120mg', '04-5541', 'x24 tabs',
    120, 320000, 'NGN', false,
    now() + interval '500 days', 6.6018, 3.3515, '',
    'Lagos', 'Ikeja', 'Ikeja', true
  ),
  (
    'c6666666-6666-4666-8666-666666666666',
    'a4444444-4444-4444-8444-444444444444', 'b6666666-6666-4666-8666-666666666666',
    'Lonart', 'artemether/lumefantrine', 'tablet', '20mg/120mg', '04-5541', 'x24 tabs',
    90, 275000, 'NGN', false,
    now() + interval '510 days', 6.4474, 3.4712, '',
    'Lagos', 'Eti-Osa', 'Lekki Phase 1', true
  ),
  -- Everyday essentials across the other pharmacies.
  (
    'c7777777-7777-4777-8777-777777777777',
    'a3333333-3333-4333-8333-333333333333', 'b5555555-5555-4555-8555-555555555555',
    'Flagyl', 'metronidazole', 'tablet', '400mg', '04-1120', 'x20 tabs',
    300, 110000, 'NGN', false,
    now() + interval '450 days', 6.4975, 3.3581, '',
    'Lagos', 'Surulere', 'Surulere', true
  ),
  (
    'c8888888-8888-4888-8888-888888888888',
    'a4444444-4444-4444-8444-444444444444', 'b7777777-7777-4777-8777-777777777777',
    'Ventolin', 'salbutamol', 'inhaler', '100mcg', '04-7788', '200 doses',
    25, 1150000, 'NGN', true,
    now() + interval '600 days', 6.4474, 3.4712, '',
    'Lagos', 'Eti-Osa', 'Lekki Phase 1', true
  ),
  (
    'c9999999-9999-4999-8999-999999999999',
    'a1111111-1111-4111-8111-111111111111', 'b8888888-8888-4888-8888-888888888888',
    'Brufen', 'ibuprofen', 'tablet', '400mg', '04-9902', 'x30 tabs',
    150, 200000, 'NGN', false,
    now() + interval '470 days', 6.5105, 3.3792, '',
    'Lagos', 'Lagos Mainland', 'Yaba', true
  ),
  (
    'c0000000-0000-4000-8000-000000000001',
    'a2222222-2222-4222-8222-222222222222', 'b3333333-3333-4333-8333-333333333333',
    'Amoxil', 'amoxicillin', 'capsule', '500mg', '04-2210', 'x20 caps',
    80, 300000, 'NGN', true,
    now() + interval '430 days', 6.6018, 3.3515, '',
    'Lagos', 'Ikeja', 'Ikeja', true
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'a3333333-3333-4333-8333-333333333333', 'b9999999-9999-4999-8999-999999999999',
    'Ciprotab', 'ciprofloxacin', 'tablet', '500mg', '04-4417', 'x10 tabs',
    70, 240000, 'NGN', true,
    now() + interval '420 days', 6.4975, 3.3581, '',
    'Lagos', 'Surulere', 'Surulere', true
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    'a4444444-4444-4444-8444-444444444444', 'b2222222-2222-4222-8222-222222222222',
    'Panadol', 'paracetamol', 'syrup', '120mg/5ml', '04-0877', '100ml bottle',
    110, 260000, 'NGN', false,
    now() + interval '360 days', 6.4474, 3.4712, '',
    'Lagos', 'Eti-Osa', 'Lekki Phase 1', true
  ),
  (
    'c0000000-0000-4000-8000-000000000004',
    'a2222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000000',
    'Electral', 'oral rehydration salts', 'other', 'sachet', '04-6630', 'x10 sachets',
    400, 50000, 'NGN', false,
    now() + interval '700 days', 6.6018, 3.3515, '',
    'Lagos', 'Ikeja', 'Ikeja', true
  ),
  -- Out-of-stock row: excluded from search (is_available = false).
  (
    'c0000000-0000-4000-8000-000000000005',
    'a4444444-4444-4444-8444-444444444444', 'b3333333-3333-4333-8333-333333333333',
    'Amoxil', 'amoxicillin', 'capsule', '500mg', '04-2210', 'x20 caps',
    0, 310000, 'NGN', true,
    now() + interval '430 days', 6.4474, 3.4712, '',
    'Lagos', 'Eti-Osa', 'Lekki Phase 1', false
  )
  on conflict (id) do update set
    pharmacy_id = excluded.pharmacy_id,
    medicine_id = excluded.medicine_id,
    brand_name = excluded.brand_name,
    generic_name = excluded.generic_name,
    form = excluded.form,
    strength = excluded.strength,
    nafdac_number = excluded.nafdac_number,
    pack_size = excluded.pack_size,
    quantity = excluded.quantity,
    price_kobo = excluded.price_kobo,
    currency = excluded.currency,
    prescription_required = excluded.prescription_required,
    expiry_date = excluded.expiry_date,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    state = excluded.state,
    lga = excluded.lga,
    city = excluded.city,
    is_available = excluded.is_available,
    updated_at = now();

  -- ============ Pharmacy reviews ============
  -- Fictional sample reviews for development only. patient_id references
  -- public.users (which itself references auth.users), so reviews can only
  -- be authored by real signed-up users — no synthetic accounts. The seed
  -- owner writes one review per pharmacy; a 2nd and 3rd signed-up user each
  -- add one more review per pharmacy (slots 2 and 3), so 3 test accounts
  -- yield the full set of 9. author_name is display text only. Slots without
  -- a user are skipped, keeping the (pharmacy_id, patient_id) pair unique.
  -- The refresh_pharmacy_rating trigger recomputes rating_avg/review_count
  -- on insert, so the static seed values above get replaced by these.

  select coalesce(
    (select array_agg(t.id order by t.created_at)
     from (select u.id, u.created_at from public.users u order by u.created_at limit 3) t),
    array[]::uuid[])
  into reviewers;

  insert into public.pharmacy_reviews (
    id, pharmacy_id, patient_id, author_name, rating, comment,
    created_at, updated_at
  )
  select
    d.id, d.pharmacy_id, reviewers[d.slot], d.author_name, d.rating, d.comment,
    now() - make_interval(days => d.days_ago),
    now() - make_interval(days => d.days_ago)
  from (values
    -- Lifecare Pharmacy Yaba: slots 5, 4, 5 -> avg 4.7 with 3 users.
    ('d1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 1,
     'Adaeze O.', 5, 'Fast service and the pharmacist explained the dosage clearly.', 12),
    ('d1111111-1111-4111-8111-111111111112', 'a1111111-1111-4111-8111-111111111111', 2,
     'Tunde B.', 4, 'Good stock of antimalarials. Queue was a bit long on Saturday.', 9),
    ('d1111111-1111-4111-8111-111111111113', 'a1111111-1111-4111-8111-111111111111', 3,
     'Fatima S.', 5, 'They confirmed my prescription on the phone before I came. Very professional.', 4),
    -- Wellness Point Pharmacy Ikeja: slots 4, 4, 3 -> avg 3.7 with 3 users.
    ('d2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 1,
     'Adaeze O.', 4, 'Found my inhaler here when two other pharmacies were out of stock.', 15),
    ('d2222222-2222-4222-8222-222222222223', 'a2222222-2222-4222-8222-222222222222', 2,
     'Chinedu E.', 4, 'Fair prices and quick pickup. Parking is tight though.', 7),
    ('d2222222-2222-4222-8222-222222222224', 'a2222222-2222-4222-8222-222222222222', 3,
     'Aisha M.', 3, 'Helpful staff, but delivery took a day longer than promised.', 2),
    -- Carehub Pharmacy Surulere: slots 5, 5 -> avg 5.0 with 2+ users.
    ('d3333333-3333-4333-8333-333333333333', 'a3333333-3333-4333-8333-333333333333', 1,
     'Adaeze O.', 5, 'My go-to pharmacy. They always have children''s syrups in stock.', 20),
    ('d3333333-3333-4333-8333-333333333334', 'a3333333-3333-4333-8333-333333333333', 2,
     'Emeka N.', 5, 'Pharmacist took time to check my other medications for interactions.', 6),
    -- Island Meds Pharmacy Lekki: slot 4 -> avg 4.0.
    ('d4444444-4444-4444-8444-444444444444', 'a4444444-4444-4444-8444-444444444444', 1,
     'Adaeze O.', 4, 'Great late-night hours. Prices slightly higher than the mainland.', 11)
  ) as d(id, pharmacy_id, slot, author_name, rating, comment, days_ago)
  where reviewers[d.slot] is not null
  on conflict (id) do update set
    rating = excluded.rating,
    comment = excluded.comment,
    updated_at = now();
end $$;

-- ============ Cleanup (run only to wipe the sample data) ============
-- delete from public.pharmacy_reviews where id in (
--   'd1111111-1111-4111-8111-111111111111', 'd1111111-1111-4111-8111-111111111112',
--   'd1111111-1111-4111-8111-111111111113', 'd2222222-2222-4222-8222-222222222222',
--   'd2222222-2222-4222-8222-222222222223', 'd2222222-2222-4222-8222-222222222224',
--   'd3333333-3333-4333-8333-333333333333', 'd3333333-3333-4333-8333-333333333334',
--   'd4444444-4444-4444-8444-444444444444'
-- );
-- delete from public.listings where pharmacy_id in (
--   'a1111111-1111-4111-8111-111111111111', 'a2222222-2222-4222-8222-222222222222',
--   'a3333333-3333-4333-8333-333333333333', 'a4444444-4444-4444-8444-444444444444'
-- );
-- delete from public.medicines where id in (
--   'b1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222',
--   'b3333333-3333-4333-8333-333333333333', 'b4444444-4444-4444-8444-444444444444',
--   'b5555555-5555-4555-8555-555555555555', 'b6666666-6666-4666-8666-666666666666',
--   'b7777777-7777-4777-8777-777777777777', 'b8888888-8888-4888-8888-888888888888',
--   'b9999999-9999-4999-8999-999999999999', 'b0000000-0000-4000-8000-000000000000'
-- );
-- delete from public.pharmacies where id in (
--   'a1111111-1111-4111-8111-111111111111', 'a2222222-2222-4222-8222-222222222222',
--   'a3333333-3333-4333-8333-333333333333', 'a4444444-4444-4444-8444-444444444444'
-- );
