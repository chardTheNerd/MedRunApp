import React from 'react';
import { AuthProvider } from './providers/AuthProvider';
import { CatalogProvider } from './providers/CatalogProvider';
import { ConsultationProvider } from './providers/ConsultationProvider';
import { ConsultSheetProvider } from './providers/ConsultSheetProvider';
import { OrderProvider } from './providers/OrderProvider';
import { ThemeProvider } from './providers/ThemeProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CatalogProvider>
          <OrderProvider>
            <ConsultationProvider>
              <ConsultSheetProvider>{children}</ConsultSheetProvider>
            </ConsultationProvider>
          </OrderProvider>
        </CatalogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
