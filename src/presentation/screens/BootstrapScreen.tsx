import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { env } from '../../core/config/env';
import { NIGERIAN_STATES } from '../../core/config/nigeria';
import { colors } from '../../core/theme/colors';
import { useAuth } from '../providers/AuthProvider';

export function BootstrapScreen() {
  const auth = useAuth();
  const [displayName, setDisplayName] = useState('Test Patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleAuth(mode: 'signup' | 'signin') {
    if (!email.trim() || !password) {
      setNotice('Enter an email and password first.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const ok =
        mode === 'signup'
          ? await auth.registerPatient({ email: email.trim(), password, displayName: displayName.trim() })
          : await auth.signIn(email.trim(), password);
      setNotice(ok ? `${mode === 'signup' ? 'Signed up' : 'Signed in'} as ${auth.user?.displayName ?? email.trim()}` : (auth.error ?? 'Failed.'));
    } finally {
      setBusy(false);
    }
  }

  const backendLabel =
    auth.status === 'unconfigured'
      ? 'Supabase keys not set'
      : auth.status === 'authenticated'
        ? `Signed in as ${auth.user?.displayName}`
        : auth.status === 'loading'
          ? 'Connecting…'
          : 'Supabase ready · signed out';

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Nigeria · {env.locale.currency} · {env.locale.timezone}</Text>
      <Text style={styles.title}>MedRun</Text>
      <Text style={styles.subtitle}>Multi-vendor pharmacy MVP for Android</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Foundation</Text>
        <Text style={styles.row}>Architecture: domain → data → presentation</Text>
        <Text style={styles.row}>State: Provider + BLoC reducers</Text>
        <Text style={styles.row}>Collections: users, pharmacies, listings, orders, consultations</Text>
        <Text style={styles.row}>Coverage: {NIGERIAN_STATES.length} states including FCT</Text>
        <Text style={styles.backend}>{backendLabel}</Text>
        {auth.error ? <Text style={styles.error}>{auth.error}</Text> : null}
        <Text style={styles.devTitle}>Dev: live signup test</Text>
        <TextInput
          style={styles.input}
          placeholder="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 chars)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!busy}
        />
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={() => handleAuth('signup')}
            disabled={busy}
          >
            <Text style={styles.buttonText}>{busy ? 'Working…' : 'Sign up'}</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonSecondary, busy && styles.buttonDisabled]}
            onPress={() => handleAuth('signin')}
            disabled={busy}
          >
            <Text style={styles.buttonText}>{busy ? 'Working…' : 'Sign in'}</Text>
          </Pressable>
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandDark,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  kicker: {
    color: colors.accent,
    fontSize: 13,
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: 40,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.surface,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  row: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 6,
  },
  backend: {
    marginTop: 12,
    color: colors.brand,
    fontWeight: '600',
  },
  error: {
    marginTop: 8,
    color: colors.danger,
  },
  devTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  button: {
    flex: 1,
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.brandDark,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  notice: {
    marginTop: 8,
    color: colors.brand,
    fontWeight: '600',
  },
});
