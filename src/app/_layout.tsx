import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '../presentation/AppProviders';
import { AskPharmacistButton } from '../presentation/components/AskPharmacistButton';
import { colors } from '../core/theme/colors';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.brand },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'MedRun' }} />
        <Stack.Screen name="consult" options={{ title: 'Ask a Pharmacist' }} />
        <Stack.Screen name="listing/[id]" options={{ title: 'Medicine' }} />
      </Stack>
      <AskPharmacistButton />
      <StatusBar style="light" />
    </AppProviders>
  );
}
