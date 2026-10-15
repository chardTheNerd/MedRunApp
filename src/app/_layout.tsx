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
        <Stack.Screen name="index" options={{ title: 'MedRun' }} />
        <Stack.Screen name="consult" options={{ title: 'Ask a Pharmacist' }} />
        <Stack.Screen name="listing/[id]" options={{ title: 'Medicine' }} />
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
