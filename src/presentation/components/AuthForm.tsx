import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../core/theme/colors';
import { useAuth } from '../providers/AuthProvider';

/** Compact sign up / sign in form used wherever auth is required. */
export function AuthForm() {
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
        <Text style={styles.signedIn}>Signed in as {auth.user.displayName}</Text>
        <Pressable onPress={() => auth.signOut()} style={styles.link}>
          <Text style={styles.linkText}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
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
      {auth.error ? <Text style={styles.error}>{auth.error}</Text> : null}
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
    color: colors.ink,
  },
  link: {
    padding: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand,
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
    backgroundColor: colors.white,
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
  error: {
    marginTop: 8,
    color: colors.danger,
  },
});
