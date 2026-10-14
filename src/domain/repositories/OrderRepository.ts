import { Result } from '../../core/types/result';
import { Order, OrderStatus } from '../entities/Order';

export type PlaceOrderInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: OrderStatus;
};

export interface OrderRepository {
  place(input: PlaceOrderInput): Promise<Result<Order>>;
  getById(orderId: string): Promise<Result<Order>>;
  listForPatient(patientId: string): Promise<Result<Order[]>>;
  listForPharmacy(pharmacyId: string): Promise<Result<Order[]>>;
  updateStatus(orderId: string, status: OrderStatus): Promise<Result<Order>>;
}
