import { AppError } from '../../../core/errors/AppError';
import { Order, OrderStatus } from '../../../domain/entities/Order';
import { PlaceOrderInput } from '../../../domain/repositories/OrderRepository';
import { getSupabase } from '../SupabaseClient';
import { throwIfError, toAppError } from '../errors';
import { orderFromRow } from '../mappers';
import { OrderRow } from '../rows';
import { TABLES } from '../tables';

/**
 * Atomic checkout: one `place_order` rpc locks each listing row (FOR UPDATE),
 * validates, decrements, inserts the order, and returns it — all in a single
 * transaction, so concurrent checkouts on the last pack serialize instead
 * of overselling. Requires supabase/migrations/0002_place_order_function.sql
 * to have been run in the project.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc('place_order', {
    p_order: {
      patientId: input.patientId,
      pharmacyId: input.pharmacyId,
      items: input.items,
      subtotalKobo: input.subtotalKobo,
      deliveryFeeKobo: input.deliveryFeeKobo,
      totalKobo: input.totalKobo,
      currency: 'NGN',
      fulfillment: input.fulfillment,
      deliveryAddress: input.deliveryAddress,
      status: input.status ?? 'pending',
      payment: input.payment,
      notes: input.notes,
    },
  });
  if (error) {
    throw mapRpcError(error);
  }
  return orderFromRow(data as OrderRow);
}

/**
 * The `place_order` function raises EXCEPTIONs with a machine-readable
 * prefix (see the migration). Map those to the matching AppError code so
 * the UI keeps showing the same friendly messages as before.
 */
function mapRpcError(error: { message: string; code?: string; status?: number }): AppError {
  const msg = error.message ?? '';
  if (msg.includes('PLACE_ORDER_CONFLICT:')) {
    const detail = msg.split('PLACE_ORDER_CONFLICT:')[1]?.trim() || 'Out of stock.';
    return new AppError(detail.endsWith('was not found.') ? 'not-found' : 'conflict', detail, error);
  }
  if (msg.includes('PLACE_ORDER_VALIDATION:')) {
    const detail = msg.split('PLACE_ORDER_VALIDATION:')[1]?.trim() || 'Invalid order.';
    return new AppError('validation', detail, error);
  }
  if (msg.includes('PLACE_ORDER_FORBIDDEN:')) {
    return new AppError('permission-denied', 'You can only place orders for yourself.', error);
  }
  return toAppError(error);
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
