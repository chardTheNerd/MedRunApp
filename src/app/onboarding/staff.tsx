import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { useTheme } from '../../presentation/providers/ThemeProvider';

/** Staff onboarding: sign in, or learn how to be added to a pharmacy. */
export default function StaffOnboardingScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { palette } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
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
      <Text style={[styles.title, { color: palette.ink }]}>Pharmacy staff</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        Sign in to manage your pharmacy&apos;s inventory, incoming orders, and
        patient chats. New staff need an invite from a pharmacy admin first.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        style={[styles.primary, { backgroundColor: palette.brand }]}
        onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin', role: 'staff' } })}
      >
        <Text style={styles.primaryText}>Sign in</Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: palette.card }]}>
        <Text style={[styles.cardTitle, { color: palette.ink }]}>Need access?</Text>
        <Text style={[styles.step, { color: palette.muted }]}>
          1. Ask a pharmacy admin to create your account in Supabase Auth.
        </Text>
        <Text style={[styles.step, { color: palette.muted }]}>
          2. Have them set your role to <Text style={{ fontWeight: '700' }}>pharmacist</Text>{' '}
          or <Text style={{ fontWeight: '700' }}>pharmacy_admin</Text> and add a row
          in <Text style={{ fontWeight: '700' }}>pharmacy_staff</Text>.
        </Text>
        <Text style={[styles.step, { color: palette.muted }]}>
          3. Sign in above — the staff dashboard unlocks automatically.
        </Text>
      </View>

      {auth.error ? (
        <Text style={[styles.error, { color: palette.danger }]}>{auth.error}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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
  primary: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  step: {
    fontSize: 13,
    marginTop: 6,
  },
  error: {
    marginTop: 12,
    fontSize: 13,
  },
});
