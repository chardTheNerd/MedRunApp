import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '../presentation/AppProviders';
import { AskPharmacistButton } from '../presentation/components/AskPharmacistButton';
import { lightPalette } from '../core/theme/colors';
import { useTheme } from '../presentation/providers/ThemeProvider';

function ThemedStack() {
  const { effective } = useTheme();
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: lightPalette.brand },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: {
            backgroundColor: effective === 'dark' ? '#0C1626' : '#F2F6FC',
          },
        }}
      >
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/role" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/patient" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/staff" options={{ headerShown: false }} />
        <Stack.Screen name="auth/index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/check-email" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ title: 'MedRun' }} />
        <Stack.Screen name="consult" options={{ title: 'Ask a Pharmacist' }} />
        <Stack.Screen name="listing/[id]" options={{ title: 'Medicine' }} />
        <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
        <Stack.Screen name="pharmacy/[id]" options={{ title: 'Pharmacy' }} />
        <Stack.Screen name="staff/index" options={{ title: 'Staff' }} />
        <Stack.Screen name="staff/inventory" options={{ title: 'Inventory' }} />
        <Stack.Screen name="staff/orders" options={{ title: 'Incoming orders' }} />
        <Stack.Screen name="staff/consults" options={{ title: 'Patient chats' }} />
      </Stack>
      <AskPharmacistButton />
      <StatusBar style={effective === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <ThemedStack />
    </AppProviders>
  );
}
