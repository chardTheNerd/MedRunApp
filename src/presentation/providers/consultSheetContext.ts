import React, { useContext } from 'react';

export type ConsultSheetParams = {
  drug?: string;
  pharmacyId?: string;
  consultationId?: string;
};

export type ConsultSheetContextValue = {
  params: ConsultSheetParams | null;
  openConsult: (params?: ConsultSheetParams) => void;
  closeConsult: () => void;
};

export const ConsultSheetContext = React.createContext<ConsultSheetContextValue | null>(null);

export function useConsultSheet() {
  const value = useContext(ConsultSheetContext);
  if (!value) {
    throw new Error('useConsultSheet must be used inside ConsultSheetProvider.');
  }
  return value;
}
