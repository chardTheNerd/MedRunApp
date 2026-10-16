import React from 'react';
import { AuthProvider } from './providers/AuthProvider';
import { CatalogProvider } from './providers/CatalogProvider';
import { ConsultationProvider } from './providers/ConsultationProvider';
import { ConsultSheetProvider } from './providers/ConsultSheetProvider';
import { OrderProvider } from './providers/OrderProvider';
import { StaffProvider } from './providers/StaffProvider';
import { ThemeProvider } from './providers/ThemeProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CatalogProvider>
          <OrderProvider>
            <ConsultationProvider>
              <StaffProvider>
                <ConsultSheetProvider>{children}</ConsultSheetProvider>
              </StaffProvider>
            </ConsultationProvider>
          </OrderProvider>
        </CatalogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
