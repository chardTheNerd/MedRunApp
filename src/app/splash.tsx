import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../presentation/providers/AuthProvider';
import { useTheme } from '../presentation/providers/ThemeProvider';

/**
 * Brief branding splash. Redirects to the role picker on the first run, and
 * to the role-appropriate home on subsequent runs (signed-in patients →
 * /home, staff → /staff, otherwise → /onboarding/role).
 */
export default function SplashScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { palette } = useTheme();

  useEffect(() => {
    const id = setTimeout(() => {
      if (auth.status === 'authenticated' && auth.user) {
        router.replace(auth.user.role === 'patient' ? '/home' : '/staff');
      } else {
        router.replace('/onboarding/role');
      }
    }, 600);
    return () => clearTimeout(id);
    // We only want this to run on mount once auth has been initialised;
    // subsequent auth changes are handled by the role-specific screens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status]);

  return (
    <View style={[styles.container, { backgroundColor: palette.brand }]}>
      <Text style={styles.title}>MedRun</Text>
      <Text style={styles.subtitle}>Find your medicine nearby</Text>
      <ActivityIndicator color="#FFFFFF" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.9,
    marginTop: 8,
  },
  spinner: {
    marginTop: 32,
  },
});
