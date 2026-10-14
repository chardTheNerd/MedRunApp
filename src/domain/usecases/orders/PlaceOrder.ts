import { AppError } from '../../../core/errors/AppError';
import { err, Result } from '../../../core/types/result';
import { Order } from '../../entities/Order';
import { OrderRepository, PlaceOrderInput } from '../../repositories/OrderRepository';

export class PlaceOrder {
  constructor(private readonly orders: OrderRepository) {}

  execute(input: PlaceOrderInput): Promise<Result<Order>> {
    if (input.items.length === 0) {
      return Promise.resolve(err(new AppError('validation', 'Add at least one medicine to the order.')));
    }
    if (input.currency !== 'NGN') {
      return Promise.resolve(err(new AppError('validation', 'Orders must be priced in naira.')));
    }
    if (input.fulfillment === 'delivery' && !input.deliveryAddress) {
      return Promise.resolve(err(new AppError('validation', 'A Nigerian delivery address is required.')));
    }
    return this.orders.place({ ...input, status: 'pending' });
  }
}
