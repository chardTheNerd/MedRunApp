import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { container } from '../../app/di/container';
import { Order } from '../../domain/entities/Order';
import { PlaceOrderInput } from '../../domain/repositories/OrderRepository';

type OrderState = {
  orders: Order[];
  lastPlaced: Order | null;
  loading: boolean;
  error: string | null;
};

type OrderEvent =
  | { type: 'loading' }
  | { type: 'loaded'; orders: Order[] }
  | { type: 'placed'; order: Order }
  | { type: 'failed'; message: string };

function orderReducer(state: OrderState, event: OrderEvent): OrderState {
  switch (event.type) {
    case 'loading':
      return { ...state, loading: true, error: null };
    case 'loaded':
      return { ...state, loading: false, orders: event.orders };
    case 'placed':
      return {
        ...state,
        loading: false,
        lastPlaced: event.order,
        orders: [event.order, ...state.orders.filter((item) => item.id !== event.order.id)],
      };
    case 'failed':
      return { ...state, loading: false, error: event.message };
    default:
      return state;
  }
}

type OrderContextValue = OrderState & {
  loadPatientOrders: (patientId: string) => Promise<void>;
  place: (input: PlaceOrderInput) => Promise<Order | null>;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, {
    orders: [],
    lastPlaced: null,
    loading: false,
    error: null,
  });

  const loadPatientOrders = useCallback(async (patientId: string) => {
    dispatch({ type: 'loading' });
    const result = await container.repositories.orders.listForPatient(patientId);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return;
    }
    dispatch({ type: 'loaded', orders: result.value });
  }, []);

  const place = useCallback(async (input: PlaceOrderInput) => {
    dispatch({ type: 'loading' });
    const result = await container.usecases.placeOrder.execute(input);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return null;
    }
    dispatch({ type: 'placed', order: result.value });
    return result.value;
  }, []);

  const value = useMemo(
    () => ({ ...state, loadPatientOrders, place }),
    [state, loadPatientOrders, place],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const value = useContext(OrderContext);
  if (!value) {
    throw new Error('useOrders must be used inside OrderProvider.');
  }
  return value;
}
