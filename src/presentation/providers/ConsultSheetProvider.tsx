import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ConsultSheet } from '../components/ConsultSheet';

export type ConsultSheetParams = {
  drug?: string;
  pharmacyId?: string;
  consultationId?: string;
};

type ConsultSheetContextValue = {
  params: ConsultSheetParams | null;
  openConsult: (params?: ConsultSheetParams) => void;
  closeConsult: () => void;
};

const ConsultSheetContext = createContext<ConsultSheetContextValue | null>(null);

/**
 * Global bottom-sheet host for the pharmacist chat. Any screen opens it via
 * openConsult (optional drug/pharmacy context); the sheet renders above the
 * current route so the user never loses their place.
 */
export function ConsultSheetProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<ConsultSheetParams | null>(null);

  const openConsult = useCallback((next?: ConsultSheetParams) => {
    setParams(next ?? {});
  }, []);

  const closeConsult = useCallback(() => {
    setParams(null);
  }, []);

  const value = useMemo(() => ({ params, openConsult, closeConsult }), [params, openConsult, closeConsult]);

  return (
    <ConsultSheetContext.Provider value={value}>
      {children}
      {params ? <ConsultSheet /> : null}
    </ConsultSheetContext.Provider>
  );
}

export function useConsultSheet() {
  const value = useContext(ConsultSheetContext);
  if (!value) {
    throw new Error('useConsultSheet must be used inside ConsultSheetProvider.');
  }
  return value;
}
