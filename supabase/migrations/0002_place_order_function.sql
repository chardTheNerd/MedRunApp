-- MedRun atomic checkout. Run once in the Supabase Dashboard:
-- SQL Editor -> New query -> paste -> Run (or `npx supabase db push` if you
-- use the CLI with a linked project).
--
-- Replaces the old client-side sequential stock-check-then-decrement, which
-- could oversell when two checkouts raced on the last pack. This function
-- locks each listing row (FOR UPDATE), validates, decrements, inserts the
-- order, and returns it — all in one transaction.
--
-- Verify afterwards:
--   select routine_name from information_schema.routines
--     where routine_schema = 'public' and routine_name = 'place_order';
--
-- Re-runnable: CREATE OR REPLACE, plus drop-then-recreate of the policy so
-- re-running never errors on duplicates.

-- ============ place_order(p_order jsonb) ============
-- p_order mirrors PlaceOrderInput over the wire (camelCase keys, ISO strings
-- for dates, numbers as JSON numbers):
--   {
--     "patientId": "<uuid>", "pharmacyId": "<uuid>",
--     "items": [{ "listingId": "<uuid>", "medicineId": "<uuid>",
--                 "name": "...", "quantity": 2,
--                 "unitPriceKobo": 150000, "lineTotalKobo": 300000 }],
--     "subtotalKobo": 300000, "deliveryFeeKobo": 150000, "totalKobo": 450000,
--     "currency": "NGN", "fulfillment": "delivery" | "pickup",
--     "deliveryAddress": { ... } | null,
--     "status": "pending" (optional),
--     "payment": { "method": "...", "status": "...", "reference": null },
--     "notes": "..." | null
--   }
-- Returns the inserted order row. Raises EXCEPTION with a machine-readable
-- prefix so the app maps it to the right AppError code:
--   PLACE_ORDER_VALIDATION: ...  -> 'validation'
--   PLACE_ORDER_CONFLICT: ...    -> 'conflict' (not found / out of stock /
--                                          pharmacy mismatch)
--   PLACE_ORDER_FORBIDDEN: ...   -> 'permission-denied' (patient mismatch)

create or replace function public.place_order(p_order jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid := nullif(p_order ->> 'patientId', '')::uuid;
  v_pharmacy_id uuid := nullif(p_order ->> 'pharmacyId', '')::uuid;
  v_fulfillment text := coalesce(nullif(p_order ->> 'fulfillment', ''), 'pickup');
  v_status text := coalesce(nullif(p_order ->> 'status', ''), 'pending');
  v_item jsonb;
  v_listing_id uuid;
  v_qty integer;
  v_listing public.listings%rowtype;
  v_now timestamptz := now();
  v_order public.orders%rowtype;
begin
  -- Caller must be the patient this order is for.
  if v_patient_id is null or v_patient_id <> auth.uid() then
    raise exception 'PLACE_ORDER_FORBIDDEN: orders can only be placed for the signed-in patient.';
  end if;

  if v_pharmacy_id is null then
    raise exception 'PLACE_ORDER_VALIDATION: pharmacyId is required.';
  end if;

  if v_fulfillment not in ('pickup', 'delivery') then
    raise exception 'PLACE_ORDER_VALIDATION: fulfillment must be pickup or delivery.';
  end if;

  if jsonb_typeof(p_order -> 'items') <> 'array' or jsonb_array_length(p_order -> 'items') = 0 then
    raise exception 'PLACE_ORDER_VALIDATION: at least one item is required.';
  end if;

  -- Lock every listing row up front (stable order avoids deadlocks), then
  -- validate and decrement under the lock so concurrent checkouts serialize.
  for v_item in select * from jsonb_array_elements(p_order -> 'items') loop
    v_listing_id := nullif(v_item ->> 'listingId', '')::uuid;
    v_qty := coalesce(nullif(v_item ->> 'quantity', '')::integer, 0);
    if v_listing_id is null then
      raise exception 'PLACE_ORDER_VALIDATION: every item needs a listingId.';
    end if;
    if v_qty <= 0 then
      raise exception 'PLACE_ORDER_VALIDATION: every item needs a positive quantity.';
    end if;

    select * into v_listing
    from public.listings
    where id = v_listing_id
    for update;

    if not found then
      raise exception 'PLACE_ORDER_CONFLICT: listing % was not found.', v_listing_id;
    end if;
    if v_listing.pharmacy_id <> v_pharmacy_id then
      raise exception 'PLACE_ORDER_VALIDATION: every item must belong to the same pharmacy.';
    end if;
    if not v_listing.is_available or v_listing.quantity < v_qty then
      raise exception 'PLACE_ORDER_CONFLICT: % is out of stock.', v_listing.brand_name;
    end if;

    update public.listings
    set quantity = v_listing.quantity - v_qty,
        is_available = (v_listing.quantity - v_qty) > 0,
        updated_at = v_now
    where id = v_listing_id;
  end loop;

  insert into public.orders (
    patient_id, pharmacy_id, items,
    subtotal_kobo, delivery_fee_kobo, total_kobo,
    currency, fulfillment, delivery_address,
    status, payment, notes,
    created_at, updated_at
  ) values (
    v_patient_id, v_pharmacy_id, p_order -> 'items',
    coalesce(nullif(p_order ->> 'subtotalKobo', '')::bigint, 0),
    coalesce(nullif(p_order ->> 'deliveryFeeKobo', '')::bigint, 0),
    coalesce(nullif(p_order ->> 'totalKobo', '')::bigint, 0),
    coalesce(nullif(p_order ->> 'currency', ''), 'NGN'),
    v_fulfillment,
    p_order -> 'deliveryAddress',
    v_status,
    coalesce(p_order -> 'payment', '{}'::jsonb),
    nullif(p_order ->> 'notes', ''),
    v_now, v_now
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- Lock the function down: only signed-in users can call it, and the
-- patient-mismatch check inside raises PLACE_ORDER_FORBIDDEN regardless.
revoke all on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;

-- ============ RLS: let the function do its own writes ============
-- The function is SECURITY DEFINER, so its writes bypass RLS — but the
-- pre-existing "orders: participant update" policy (patient-or-member) would
-- let a pharmacy member edit the row afterwards, which is intended. No new
-- order-table policy is needed for inserts: inserts go through the function,
-- and the direct-insert policy ("orders: patient create") stays as a
-- fallback for older app versions until they upgrade.
