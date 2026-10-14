import { DeliveryAddress } from './User';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';

export type FulfillmentType = 'delivery' | 'pickup';

export type PaymentMethod = 'paystack' | 'flutterwave' | 'wallet' | 'cash_on_delivery';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderItem = {
  listingId: string;
  medicineId: string;
  name: string;
  quantity: number;
  unitPriceKobo: number;
  lineTotalKobo: number;
};

export type Order = {
  id: string;
  patientId: string;
  pharmacyId: string;
  items: OrderItem[];
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  currency: 'NGN';
  fulfillment: FulfillmentType;
  deliveryAddress: DeliveryAddress | null;
  status: OrderStatus;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    reference: string | null;
  };
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};
