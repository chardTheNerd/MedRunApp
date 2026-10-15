import React from 'react';
import { Sheet } from './Sheet';
import { ConsultPanel } from './ConsultPanel';
import { useConsultSheet } from '../providers/ConsultSheetProvider';

/** Bottom-sheet host for the pharmacist chat, rendered above any screen. */
export function ConsultSheet() {
  const { params, closeConsult } = useConsultSheet();
  if (!params) {
    return null;
  }
  return (
    <Sheet visible onClose={closeConsult} title="Ask a Pharmacist">
      <ConsultPanel
        drug={params.drug}
        pharmacyId={params.pharmacyId}
        consultationId={params.consultationId}
      />
    </Sheet>
  );
}
