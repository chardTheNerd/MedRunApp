import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../core/theme/colors';
import { ConsultPanel } from '../presentation/components/ConsultPanel';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Deep-link fallback for the pharmacist chat (the floating button and result
 * cards open it as a bottom sheet instead). Renders the same panel full-page.
 */
export default function ConsultScreen() {
  const params = useLocalSearchParams<{ drug?: string; pharmacyId?: string; consultationId?: string }>();
  return (
    <View style={styles.container}>
      <ConsultPanel
        drug={first(params.drug)}
        pharmacyId={first(params.pharmacyId)}
        consultationId={first(params.consultationId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
  },
});
