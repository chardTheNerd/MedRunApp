import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { useTheme } from '../../presentation/providers/ThemeProvider';

type Mode = 'signin' | 'signup';
type Role = 'patient' | 'staff';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Unified auth screen used by both the patient and staff onboarding flows.
 * Mode (sign in / create account) and role (patient / staff) come from
 * route params. Staff accounts can't be self-created here — only signed in
 * to — and the staff onboarding step makes that clear.
 */
export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string; role?: string }>();
  const router = useRouter();
  const auth = useAuth();
  const { palette } = useTheme();

  const mode: Mode = first(params.mode) === 'signup' ? 'signup' : 'signin';
  const role: Role = first(params.role) === 'staff' ? 'staff' : 'patient';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password || (mode === 'signup' && !displayName.trim())) {
      return;
    }
    setBusy(true);
    try {
      const outcome = mode === 'signup'
        ? await auth.registerPatient({ email: email.trim(), password, displayName: displayName.trim() })
        : await auth.signIn(email.trim(), password);
      if (outcome === 'check-email') {
        router.replace({ pathname: '/auth/check-email', params: { email: email.trim() } });
      } else if (outcome === 'signed-in') {
        router.replace(role === 'staff' ? '/staff' : '/home');
      }
    } finally {
      setBusy(false);
    }
  }

  const isStaffSignup = role === 'staff' && mode === 'signup';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => router.back()}
        style={styles.back}
      >
        <Text style={[styles.backText, { color: palette.brand }]}>← Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: palette.ink }]}>
        {role === 'staff' ? 'Pharmacy staff' : 'Patient'} ·{' '}
        {mode === 'signup' ? 'Create account' : 'Sign in'}
      </Text>

      {isStaffSignup ? (
        <View style={[styles.notice, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.noticeText, { color: palette.ink }]}>
            Staff accounts are created by your pharmacy admin in Supabase. If you
            don&apos;t have one yet, ask the admin to set you up, then sign in.
          </Text>
        </View>
      ) : null}

      <View style={styles.form}>
        {mode === 'signup' ? (
          <TextInput
            style={[
              styles.input,
              { borderColor: palette.border, color: palette.ink, backgroundColor: palette.card },
            ]}
            placeholder="Display name"
            placeholderTextColor={palette.muted}
            value={displayName}
            onChangeText={setDisplayName}
            editable={!busy}
          />
        ) : null}
        <TextInput
          style={[
            styles.input,
            { borderColor: palette.border, color: palette.ink, backgroundColor: palette.card },
          ]}
          placeholder="Email"
          placeholderTextColor={palette.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!busy}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: palette.border, color: palette.ink, backgroundColor: palette.card },
          ]}
          placeholder={mode === 'signup' ? 'Password (min 6 chars)' : 'Password'}
          placeholderTextColor={palette.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!busy}
        />
        <Pressable
          style={[
            styles.submit,
            { backgroundColor: palette.brand },
            (busy || isStaffSignup) && styles.disabled,
          ]}
          onPress={handleSubmit}
          disabled={busy || isStaffSignup}
        >
          <Text style={styles.submitText}>
            {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </Text>
        </Pressable>
        {auth.error ? (
          <Text style={[styles.error, { color: palette.danger }]}>{auth.error}</Text>
        ) : null}
      </View>
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
  notice: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  noticeText: {
    fontSize: 13,
  },
  form: {
    marginTop: 16,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  submit: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  error: {
    marginTop: 8,
    fontSize: 13,
  },
});
