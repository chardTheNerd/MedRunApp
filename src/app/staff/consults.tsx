import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { useConsultSheet } from '../../presentation/providers/consultSheetContext';
import { useStaff } from '../../presentation/providers/StaffProvider';
import { useTheme } from '../../presentation/providers/ThemeProvider';

/** Staff consultation inbox: pharmacy-scoped "Ask a pharmacist" chats. */
export default function StaffConsultsScreen() {
  const router = useRouter();
  const auth = useAuth();
  const staff = useStaff();
  const { openConsult } = useConsultSheet();
  const { palette } = useTheme();

  const pharmacyId = staff.selectedPharmacyId;

  useEffect(() => {
    if (pharmacyId) {
      staff.loadConsultations(pharmacyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  if (!auth.user) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={[styles.title, { color: palette.ink }]}>Staff sign in required</Text>
        <Pressable
          style={[styles.button, { backgroundColor: palette.brand }]}
          onPress={() => router.push('/onboarding/staff')}
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <FlatList
        data={staff.consultations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
            onPress={() =>
              openConsult({ consultationId: item.id, pharmacyId: item.pharmacyId ?? undefined })
            }
          >
            <Text style={[styles.complaint, { color: palette.ink }]} numberOfLines={2}>
              {item.chiefComplaint}
            </Text>
            <Text style={[styles.meta, { color: palette.muted }]}>
              {item.status} · {item.channel} · {item.createdAt.toLocaleDateString('en-NG')}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: palette.muted }]}>
            {staff.loading ? 'Loading consultations…' : 'No patient chats for this pharmacy yet.'}
          </Text>
        }
        ListFooterComponent={
          staff.error ? <Text style={[styles.error, { color: palette.danger }]}>{staff.error}</Text> : null
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  complaint: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 32,
  },
  error: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
  },
});
