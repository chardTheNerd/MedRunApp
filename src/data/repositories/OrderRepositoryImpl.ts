import { Result } from '../../core/types/result';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderRepository, PlaceOrderInput } from '../../domain/repositories/OrderRepository';
import {
  getOrderById,
  listOrdersForPatient,
  listOrdersForPharmacy,
  placeOrder,
  updateOrderStatus,
} from '../supabase/connectors/ordersConnector';
import { wrap } from '../supabase/wrap';

export class OrderRepositoryImpl implements OrderRepository {
  place(input: PlaceOrderInput): Promise<Result<Order>> {
    return wrap(() => placeOrder(input));
  }

  getById(orderId: string): Promise<Result<Order>> {
    return wrap(() => getOrderById(orderId));
  }

  listForPatient(patientId: string): Promise<Result<Order[]>> {
    return wrap(() => listOrdersForPatient(patientId));
  }

  listForPharmacy(pharmacyId: string): Promise<Result<Order[]>> {
    return wrap(() => listOrdersForPharmacy(pharmacyId));
  }

  updateStatus(orderId: string, status: OrderStatus): Promise<Result<Order>> {
    return wrap(() => updateOrderStatus(orderId, status));
  }
}
