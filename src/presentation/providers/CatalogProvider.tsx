import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { container } from '../../di/container';
import { NearbyListingQuery } from '../../domain/repositories/InventoryRepository';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { Pharmacy } from '../../domain/entities/Pharmacy';

type CatalogState = {
  listings: InventoryListing[];
  pharmacies: Pharmacy[];
  selectedPharmacy: Pharmacy | null;
  loading: boolean;
  error: string | null;
};

type CatalogEvent =
  | { type: 'loading' }
  | { type: 'listingsLoaded'; listings: InventoryListing[] }
  | { type: 'pharmaciesLoaded'; pharmacies: Pharmacy[] }
  | { type: 'pharmacyLoaded'; pharmacy: Pharmacy }
  | { type: 'failed'; message: string };

function catalogReducer(state: CatalogState, event: CatalogEvent): CatalogState {
  switch (event.type) {
    case 'loading':
      return { ...state, loading: true, error: null };
    case 'listingsLoaded':
      return { ...state, loading: false, listings: event.listings };
    case 'pharmaciesLoaded':
      return { ...state, loading: false, pharmacies: event.pharmacies };
    case 'pharmacyLoaded':
      return { ...state, loading: false, selectedPharmacy: event.pharmacy };
    case 'failed':
      return { ...state, loading: false, error: event.message };
    default:
      return state;
  }
}

type CatalogContextValue = CatalogState & {
  searchListings: (query: NearbyListingQuery) => Promise<void>;
  searchPharmacies: (query: NearbyListingQuery) => Promise<void>;
  loadPharmacy: (pharmacyId: string) => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(catalogReducer, {
    listings: [],
    pharmacies: [],
    selectedPharmacy: null,
    loading: false,
    error: null,
  });

  const searchListings = useCallback(async (query: NearbyListingQuery) => {
    dispatch({ type: 'loading' });
    const result = await container.usecases.searchNearbyListings.execute(query);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return;
    }
    dispatch({ type: 'listingsLoaded', listings: result.value });
  }, []);

  const searchPharmacies = useCallback(async (query: NearbyListingQuery) => {
    dispatch({ type: 'loading' });
    const result = await container.repositories.pharmacies.searchNearby(query.center, query.radiusKm);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return;
    }
    dispatch({ type: 'pharmaciesLoaded', pharmacies: result.value });
  }, []);

  const loadPharmacy = useCallback(async (pharmacyId: string) => {
    dispatch({ type: 'loading' });
    const result = await container.repositories.pharmacies.getById(pharmacyId);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return;
    }
    dispatch({ type: 'pharmacyLoaded', pharmacy: result.value });
  }, []);

  const value = useMemo(
    () => ({ ...state, searchListings, searchPharmacies, loadPharmacy }),
    [state, searchListings, searchPharmacies, loadPharmacy],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) {
    throw new Error('useCatalog must be used inside CatalogProvider.');
  }
  return value;
}
