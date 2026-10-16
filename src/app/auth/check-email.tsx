import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { useTheme } from '../../presentation/providers/ThemeProvider';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Shown when Supabase Auth has email confirmation ON and the user just
 * signed up or tried to sign in. Lets them resend the confirmation and
 * links to a Gmail-style webmail page if available.
 */
export default function CheckEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const auth = useAuth();
  const { palette } = useTheme();
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);

  const email = first(params.email) ?? '';

  async function handleResend() {
    if (!email) {
      return;
    }
    setBusy(true);
    try {
      const ok = await auth.resendConfirmation(email);
      if (ok) {
        setResent(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.title, { color: palette.ink }]}>Check your email</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        We sent a confirmation link to{' '}
        <Text style={{ fontWeight: '700' }}>{email || 'your inbox'}</Text>. Tap the
        link to finish creating your account, then come back and sign in.
      </Text>

      {resent ? (
        <Text style={[styles.success, { color: palette.brandDark }]}>
          Resent — give it a minute.
        </Text>
      ) : null}

      <Pressable
        style={[styles.primary, { backgroundColor: palette.brand }, busy && styles.disabled]}
        onPress={handleResend}
        disabled={busy}
      >
        <Text style={styles.primaryText}>{busy ? 'Sending…' : 'Resend confirmation email'}</Text>
      </Pressable>

      <Pressable
        style={styles.link}
        onPress={() => {
          if (email) {
            const domain = email.split('@')[1];
            if (domain) {
              Linking.openURL(`https://${domain}`);
            }
          }
        }}
      >
        <Text style={[styles.linkText, { color: palette.brand }]}>Open my email app →</Text>
      </Pressable>

      <Pressable style={styles.link} onPress={() => router.replace('/onboarding/role')}>
        <Text style={[styles.linkText, { color: palette.muted }]}>Back to role picker</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  success: {
    fontSize: 13,
    marginBottom: 12,
  },
  primary: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  link: {
    alignItems: 'center',
    padding: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
