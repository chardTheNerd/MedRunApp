import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PharmacyAvatar } from '../../presentation/components/PharmacyAvatar';
import { useTheme } from '../../presentation/providers/ThemeProvider';

/** First-run role picker: patient or pharmacy staff. */
export default function RolePickerScreen() {
  const router = useRouter();
  const { palette } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.ink }]}>Welcome to MedRun</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>
          Tell us how you&apos;ll use the app so we can show the right tools.
        </Text>
      </View>

      <View style={styles.cards}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue as patient"
          style={[
            styles.card,
            { backgroundColor: palette.card, borderColor: palette.brand },
          ]}
          onPress={() => router.replace('/onboarding/patient')}
        >
          <Text style={styles.cardEmoji}>🩺</Text>
          <Text style={[styles.cardTitle, { color: palette.ink }]}>I&apos;m a patient</Text>
          <Text style={[styles.cardBody, { color: palette.muted }]}>
            Find medicines nearby, order for pickup or delivery, and chat with a
            licensed pharmacist.
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue as pharmacy staff"
          style={[
            styles.card,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
          onPress={() => router.replace('/onboarding/staff')}
        >
          <View style={styles.staffRow}>
            <PharmacyAvatar name="RX" size={48} />
            <View style={styles.staffText}>
              <Text style={[styles.cardTitle, { color: palette.ink }]}>I&apos;m pharmacy staff</Text>
              <Text style={[styles.cardBody, { color: palette.muted }]}>
                Manage your pharmacy&apos;s inventory, incoming orders, and patient chats.
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
  },
  cards: {
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
  },
  cardEmoji: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  cardBody: {
    fontSize: 13,
    marginTop: 4,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  staffText: {
    flex: 1,
  },
});
