import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

/**
 * Dependency-free slide-up bottom sheet (no native deps, works in Expo Go).
 * Backdrop tap and the X button dismiss; content scrolls inside the sheet.
 */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const { palette } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={styles.dismissArea}
        />
        <View style={[styles.sheet, { backgroundColor: palette.background }]}>
          <View style={[styles.handle, { backgroundColor: palette.muted }]} />
          {title ? (
            <View style={styles.header}>
              <Text style={[styles.title, { color: palette.ink }]}>{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close sheet"
                onPress={onClose}
                style={styles.closeButton}
              >
                <Text style={[styles.closeText, { color: palette.muted }]}>✕</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    flexShrink: 1,
  },
});
