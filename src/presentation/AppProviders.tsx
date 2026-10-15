import React from 'react';
import { AuthProvider } from './providers/AuthProvider';
import { CatalogProvider } from './providers/CatalogProvider';
import { ConsultationProvider } from './providers/ConsultationProvider';
import { OrderProvider } from './providers/OrderProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CatalogProvider>
        <OrderProvider>
          <ConsultationProvider>{children}</ConsultationProvider>
        </OrderProvider>
      </CatalogProvider>
    </AuthProvider>
  );
}
