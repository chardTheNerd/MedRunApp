import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

import { useAuth } from '../providers/AuthProvider';

/** Compact sign up / sign in form used wherever auth is required. */
export function AuthForm() {
  const { palette } = useTheme();
  const auth = useAuth();
  const [displayName, setDisplayName] = useState('Test Patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAuth(mode: 'signup' | 'signin') {
    if (!email.trim() || !password) {
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
        placeholder="Password (min 6 chars)"
        placeholderTextColor={palette.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!busy}
      />
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, { backgroundColor: palette.brand }, busy && styles.buttonDisabled]}
          onPress={() => handleAuth('signup')}
          disabled={busy}
        >
          <Text style={styles.buttonText}>{busy ? 'Working…' : 'Sign up'}</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            styles.buttonSecondary,
            { backgroundColor: palette.brandDark },
            busy && styles.buttonDisabled,
          ]}
          onPress={() => handleAuth('signin')}
          disabled={busy}
        >
          <Text style={styles.buttonText}>{busy ? 'Working…' : 'Sign in'}</Text>
        </Pressable>
      </View>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonSecondary: {},
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
