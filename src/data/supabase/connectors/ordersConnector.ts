import { AppError } from '../../../core/errors/AppError';
import { Order, OrderStatus } from '../../../domain/entities/Order';
import { PlaceOrderInput } from '../../../domain/repositories/OrderRepository';
import { getSupabase } from '../SupabaseClient';
import { toNumber } from '../coerce';
import { throwIfError } from '../errors';
import { orderFromRow } from '../mappers';
import { ListingRow, OrderRow } from '../rows';
import { TABLES } from '../tables';

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  // Sequential stock check + decrement. For true atomicity under
  // concurrency, replace with a `place_order` Postgres function via rpc.
  for (const item of input.items) {
    const { data, error } = await supabase
      .from(TABLES.listings)
      .select('*')
      .eq('id', item.listingId)
      .maybeSingle();
    throwIfError(error);
    if (!data) {
      throw new AppError('not-found', `Listing ${item.listingId} was not found.`);
    }
    const listing = data as ListingRow;
    const availableQty = toNumber(listing.quantity);
    if (listing.pharmacy_id !== input.pharmacyId) {
      throw new AppError('validation', 'Every item must belong to the same pharmacy.');
    }
    if (!listing.is_available || availableQty < item.quantity) {
      throw new AppError('conflict', `${listing.brand_name} is out of stock.`);
    }
    const nextQty = availableQty - item.quantity;
    const { error: updateError } = await supabase
      .from(TABLES.listings)
      .update({ quantity: nextQty, is_available: nextQty > 0, updated_at: now })
      .eq('id', item.listingId);
    throwIfError(updateError);
  }

  const { data, error } = await supabase
    .from(TABLES.orders)
    .insert({
      patient_id: input.patientId,
      pharmacy_id: input.pharmacyId,
      items: input.items,
      subtotal_kobo: input.subtotalKobo,
      delivery_fee_kobo: input.deliveryFeeKobo,
      total_kobo: input.totalKobo,
      currency: 'NGN',
      fulfillment: input.fulfillment,
      delivery_address: input.deliveryAddress,
      status: input.status ?? 'pending',
      payment: input.payment,
      notes: input.notes,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();
  throwIfError(error);

  return getOrderById((data as { id: string }).id);
}

export async function getOrderById(orderId: string): Promise<Order> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select('*')
    .eq('id', orderId)
    .single();
  throwIfError(error, 'Order was not found.');
  return orderFromRow(data as OrderRow);
}

export async function listOrdersForPatient(patientId: string): Promise<Order[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return ((data ?? []) as OrderRow[]).map(orderFromRow);
}

export async function listOrdersForPharmacy(pharmacyId: string): Promise<Order[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return ((data ?? []) as OrderRow[]).map(orderFromRow);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLES.orders)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  throwIfError(error);
  return getOrderById(orderId);
}
