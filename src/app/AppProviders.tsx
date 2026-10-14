import React from 'react';
import { AuthProvider } from '../presentation/providers/AuthProvider';
import { CatalogProvider } from '../presentation/providers/CatalogProvider';
import { ConsultationProvider } from '../presentation/providers/ConsultationProvider';
import { OrderProvider } from '../presentation/providers/OrderProvider';

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
