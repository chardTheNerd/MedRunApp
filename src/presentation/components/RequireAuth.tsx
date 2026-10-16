import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';

type RequireAuthProps = {
  children: React.ReactNode;
  message?: string;
};

/** Gate a screen so unauthenticated users see a sign-in prompt instead. */
export function RequireAuth({ children, message }: RequireAuthProps) {
  const auth = useAuth();
  const router = useRouter();
  const { palette } = useTheme();

  if (auth.status === 'authenticated' && auth.user) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.title, { color: palette.ink }]}>Sign in required</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        {message ?? 'Sign in or create an account to continue.'}
      </Text>
      <Pressable
        style={[styles.button, { backgroundColor: palette.brand }]}
        onPress={() => router.push('/onboarding/role')}
      >
        <Text style={styles.buttonText}>Sign in or create account</Text>
      </Pressable>
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
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
