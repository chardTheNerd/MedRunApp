import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

import { useAuth } from '../providers/AuthProvider';

/** Compact auth form with a Sign in / Create account toggle. Used wherever auth is required. */
export function AuthForm({ initialMode = 'signin' }: { initialMode?: 'signin' | 'signup' }) {
  const { palette } = useTheme();
  const auth = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
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
      if (mode === 'signup') {
        await auth.registerPatient({ email: email.trim(), password, displayName: displayName.trim() });
      } else {
        await auth.signIn(email.trim(), password);
      }
    } finally {
      setBusy(false);
    }
  }

  if (auth.status === 'authenticated' && auth.user) {
    return (
      <View style={styles.row}>
        <Text style={[styles.signedIn, { color: palette.ink }]}>Signed in as {auth.user.displayName}</Text>
        <Pressable onPress={() => auth.signOut()} style={styles.link}>
          <Text style={[styles.linkText, { color: palette.brand }]}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.toggleRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show sign in"
          onPress={() => setMode('signin')}
          style={[
            styles.toggle,
            mode === 'signin' && { backgroundColor: palette.brandSoft },
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              { color: mode === 'signin' ? palette.brandDark : palette.muted },
            ]}
          >
            Sign in
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show create account"
          onPress={() => setMode('signup')}
          style={[
            styles.toggle,
            mode === 'signup' && { backgroundColor: palette.brandSoft },
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              { color: mode === 'signup' ? palette.brandDark : palette.muted },
            ]}
          >
            Create account
          </Text>
        </Pressable>
      </View>
      {mode === 'signup' ? (
        <TextInput
          style={[
            styles.input,
            {
              borderColor: palette.border,
              color: palette.ink,
              backgroundColor: palette.card,
            },
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
          {
            borderColor: palette.border,
            color: palette.ink,
            backgroundColor: palette.card,
          },
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
          {
            borderColor: palette.border,
            color: palette.ink,
            backgroundColor: palette.card,
          },
        ]}
        placeholder={mode === 'signup' ? 'Password (min 6 chars)' : 'Password'}
        placeholderTextColor={palette.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!busy}
      />
      <Pressable
        style={[styles.submit, { backgroundColor: palette.brand }, busy && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={busy}
      >
        <Text style={styles.buttonText}>
          {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </Text>
      </Pressable>
      {auth.error ? <Text style={[styles.error, { color: palette.danger }]}>{auth.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signedIn: {
    fontSize: 14,
    fontWeight: '600',
  },
  link: {
    padding: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggle: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontWeight: '700',
    fontSize: 14,
  },
  submit: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  error: {
    marginTop: 8,
  },
});
