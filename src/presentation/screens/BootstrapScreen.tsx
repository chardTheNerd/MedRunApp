import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { env } from '../../core/config/env';
import { NIGERIAN_STATES } from '../../core/config/nigeria';
import { colors } from '../../core/theme/colors';
import { useAuth } from '../providers/AuthProvider';

export function BootstrapScreen() {
  const auth = useAuth();

  const backendLabel =
    auth.status === 'unconfigured'
      ? 'Firebase keys not set'
      : auth.status === 'authenticated'
        ? `Signed in as ${auth.user?.displayName}`
        : auth.status === 'loading'
          ? 'Connecting…'
          : 'Firebase ready · signed out';

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
});
