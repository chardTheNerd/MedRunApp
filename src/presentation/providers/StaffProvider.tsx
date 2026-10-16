import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { container } from '../../di/container';
import { Consultation } from '../../domain/entities/Consultation';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { Pharmacy } from '../../domain/entities/Pharmacy';

type StaffState = {
  pharmacies: Pharmacy[];
  selectedPharmacyId: string | null;
  listings: InventoryListing[];
  orders: Order[];
  consultations: Consultation[];
  loading: boolean;
  error: string | null;
};

type StaffEvent =
  | { type: 'loading' }
  | { type: 'pharmaciesLoaded'; pharmacies: Pharmacy[] }
  | { type: 'pharmacySelected'; pharmacyId: string }
  | { type: 'listingsLoaded'; listings: InventoryListing[] }
  | { type: 'ordersLoaded'; orders: Order[] }
  | { type: 'consultationsLoaded'; consultations: Consultation[] }
  | { type: 'orderUpdated'; order: Order }
  | { type: 'failed'; message: string };

function staffReducer(state: StaffState, event: StaffEvent): StaffState {
  switch (event.type) {
    case 'loading':
      return { ...state, loading: true, error: null };
    case 'pharmaciesLoaded':
      return {
        ...state,
        loading: false,
        pharmacies: event.pharmacies,
        selectedPharmacyId:
          state.selectedPharmacyId && event.pharmacies.some((p) => p.id === state.selectedPharmacyId)
            ? state.selectedPharmacyId
            : (event.pharmacies[0]?.id ?? null),
      };
    case 'pharmacySelected':
      return { ...state, selectedPharmacyId: event.pharmacyId };
    case 'listingsLoaded':
      return { ...state, loading: false, listings: event.listings };
    case 'ordersLoaded':
      return { ...state, loading: false, orders: event.orders };
    case 'consultationsLoaded':
      return { ...state, loading: false, consultations: event.consultations };
    case 'orderUpdated':
      return {
        ...state,
        loading: false,
        orders: state.orders.map((order) => (order.id === event.order.id ? event.order : order)),
      };
    case 'failed':
      return { ...state, loading: false, error: event.message };
    default:
      return state;
  }
}

type StaffContextValue = StaffState & {
  loadStaffPharmacies: (userId: string) => Promise<void>;
  selectPharmacy: (pharmacyId: string) => void;
  loadListings: (pharmacyId: string) => Promise<void>;
  loadOrders: (pharmacyId: string) => Promise<void>;
  loadConsultations: (pharmacyId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
};

const StaffContext = createContext<StaffContextValue | null>(null);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(staffReducer, {
    pharmacies: [],
    selectedPharmacyId: null,
    listings: [],
    orders: [],
    consultations: [],
    loading: false,
    error: null,
  });

  const loadStaffPharmacies = useCallback(async (userId: string) => {
    dispatch({ type: 'loading' });
    const result = await container.repositories.pharmacies.listStaffPharmacies(userId);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return;
    }
    dispatch({ type: 'pharmaciesLoaded', pharmacies: result.value });
  }, []);

  const selectPharmacy = useCallback((pharmacyId: string) => {
    dispatch({ type: 'pharmacySelected', pharmacyId });
  }, []);

  const loadListings = useCallback(async (pharmacyId: string) => {
    dispatch({ type: 'loading' });
    const result = await container.repositories.inventory.listByPharmacy(pharmacyId);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return;
    }
    dispatch({ type: 'listingsLoaded', listings: result.value });
  }, []);

  const loadOrders = useCallback(async (pharmacyId: string) => {
    dispatch({ type: 'loading' });
    const result = await container.repositories.orders.listForPharmacy(pharmacyId);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return;
    }
    dispatch({ type: 'ordersLoaded', orders: result.value });
  }, []);

  const loadConsultations = useCallback(async (pharmacyId: string) => {
    dispatch({ type: 'loading' });
    const result = await container.repositories.consultations.listForPharmacy(pharmacyId);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return;
    }
    dispatch({ type: 'consultationsLoaded', consultations: result.value });
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    const result = await container.repositories.orders.updateStatus(orderId, status);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return false;
    }
    dispatch({ type: 'orderUpdated', order: result.value });
    return true;
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loadStaffPharmacies,
      selectPharmacy,
      loadListings,
      loadOrders,
      loadConsultations,
      updateOrderStatus,
    }),
    [state, loadStaffPharmacies, selectPharmacy, loadListings, loadOrders, loadConsultations, updateOrderStatus],
  );

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff() {
  const value = useContext(StaffContext);
  if (!value) {
    throw new Error('useStaff must be used inside StaffProvider.');
  }
  return value;
}
