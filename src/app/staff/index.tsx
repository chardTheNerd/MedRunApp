import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PharmacyAvatar } from '../../presentation/components/PharmacyAvatar';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { useStaff } from '../../presentation/providers/StaffProvider';
import { useTheme } from '../../presentation/providers/ThemeProvider';

const STAFF_ROLES = ['pharmacy_admin', 'pharmacist', 'consultant'] as const;

/**
 * Staff dashboard: role-gated hub for managing owned/member pharmacies.
 * Patients see a "not staff" notice; staff pick a pharmacy then work its
 * Inventory / Orders / Consults sections.
 */
export default function StaffDashboardScreen() {
  const router = useRouter();
  const auth = useAuth();
  const staff = useStaff();
  const { palette } = useTheme();

  useEffect(() => {
    if (auth.user) {
      staff.loadStaffPharmacies(auth.user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.id]);

  if (!auth.user) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={[styles.title, { color: palette.ink }]}>Staff sign in required</Text>
        <Text style={[styles.body, { color: palette.muted }]}>
          Sign in with your pharmacy staff account to manage inventory, orders, and chats.
        </Text>
        <Pressable
          style={[styles.signOut, { backgroundColor: palette.brand }]}
          onPress={() => router.push('/onboarding/staff')}
        >
          <Text style={[styles.signOutText, { color: '#FFFFFF' }]}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  const isStaff = STAFF_ROLES.includes(auth.user.role as (typeof STAFF_ROLES)[number]);

  if (!isStaff) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={[styles.title, { color: palette.ink }]}>Not a staff account</Text>
        <Text style={[styles.body, { color: palette.muted }]}>
          Signed in as {auth.user.displayName} (role: {auth.user.role}). Ask a pharmacy admin to
          add you to a pharmacy&apos;s staff, then come back.
        </Text>
        <Pressable onPress={() => auth.signOut()} style={styles.signOut}>
          <Text style={[styles.signOutText, { color: palette.brand }]}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  const selected = staff.pharmacies.find((p) => p.id === staff.selectedPharmacyId) ?? null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: palette.ink }]}>Staff dashboard</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        {staff.loading && staff.pharmacies.length === 0
          ? 'Loading your pharmacies…'
          : staff.pharmacies.length === 0
            ? 'No pharmacies linked to this account yet.'
            : 'Select the pharmacy you are working at.'}
      </Text>

      {staff.pharmacies.map((pharmacy) => {
        const active = pharmacy.id === staff.selectedPharmacyId;
        return (
          <Pressable
            key={pharmacy.id}
            style={[
              styles.pharmacyRow,
              { borderColor: palette.border, backgroundColor: palette.card },
              active && { borderColor: palette.brand, backgroundColor: palette.brandSoft },
            ]}
            onPress={() => staff.selectPharmacy(pharmacy.id)}
          >
            <PharmacyAvatar name={pharmacy.name} size={44} />
            <View style={styles.pharmacyInfo}>
              <Text style={[styles.pharmacyName, { color: active ? palette.brandDark : palette.ink }]}>
                {pharmacy.name}
              </Text>
              <Text style={[styles.pharmacyMeta, { color: palette.muted }]}>
                PCN {pharmacy.pcnLicenseNumber}
                {pharmacy.verificationStatus === 'verified' ? ' · ✓ Verified' : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}

      {staff.error ? <Text style={[styles.error, { color: palette.danger }]}>{staff.error}</Text> : null}

      {selected ? (
        <View style={styles.sections}>
          {(
            [
              { label: 'Inventory', hint: 'Prices, stock, details', route: '/staff/inventory' as const },
              { label: 'Orders', hint: 'Incoming, confirm, fulfill', route: '/staff/orders' as const },
              { label: 'Consults', hint: 'Patient chats', route: '/staff/consults' as const },
            ]
          ).map((section) => (
            <Pressable
              key={section.label}
              style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}
              onPress={() => router.push(section.route)}
            >
              <Text style={[styles.sectionLabel, { color: palette.ink }]}>{section.label}</Text>
              <Text style={[styles.sectionHint, { color: palette.muted }]}>{section.hint}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
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
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 14,
  },
  pharmacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 15,
    fontWeight: '700',
  },
  pharmacyMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  error: {
    marginTop: 8,
    fontSize: 13,
  },
  sections: {
    marginTop: 8,
    gap: 8,
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHint: {
    fontSize: 13,
    marginTop: 4,
  },
  signOut: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
