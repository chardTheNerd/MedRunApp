import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

function initialsOf(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
  return initials || 'M';
}

/** Circular pharmacy avatar: initials on the brand color. */
export function PharmacyAvatar({ name, size = 72 }: { name: string; size?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.brand,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
