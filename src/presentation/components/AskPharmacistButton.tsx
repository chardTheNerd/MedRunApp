import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../core/theme/colors';

/**
 * Floating glass "Ask a Pharmacist" entry point. Rendered once in the root
 * layout so it is reachable from every screen; hidden on the consult screen
 * itself, where the conversation already lives.
 */
export function AskPharmacistButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/consult') {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ask a pharmacist"
      onPress={() => router.push('/consult')}
      style={styles.floating}
    >
      <BlurView intensity={70} tint="light" style={styles.glass}>
        <View style={styles.tint}>
          <Text style={styles.icon}>💊</Text>
          <Text style={styles.label}>Ask a Pharmacist</Text>
        </View>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  glass: {
    borderRadius: 28,
  },
  tint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(11, 110, 79, 0.55)',
  },
  icon: {
    fontSize: 18,
  },
  label: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
