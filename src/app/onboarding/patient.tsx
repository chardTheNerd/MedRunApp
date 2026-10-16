import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { useTheme } from '../../presentation/providers/ThemeProvider';

/** Patient onboarding: sign in, or create a patient account. */
export default function PatientOnboardingScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { palette } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to role picker"
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/onboarding/role');
          }
        }}
        style={styles.back}
      >
        <Text style={[styles.backText, { color: palette.brand }]}>← Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.ink }]}>Patient sign in</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        Sign in or create a patient account to find medicines nearby, order for
        pickup or delivery, and chat with a licensed pharmacist.
      </Text>

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          style={[styles.button, { backgroundColor: palette.brand }]}
          onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin', role: 'patient' } })}
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create patient account"
          style={[styles.button, { backgroundColor: palette.brandDark }]}
          onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup', role: 'patient' } })}
        >
          <Text style={styles.buttonText}>Create account</Text>
        </Pressable>
      </View>

      {auth.error ? (
        <Text style={[styles.error, { color: palette.danger }]}>{auth.error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  back: {
    marginBottom: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  error: {
    marginTop: 12,
    fontSize: 13,
  },
});
