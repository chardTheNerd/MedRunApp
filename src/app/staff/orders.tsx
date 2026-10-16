import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatNaira } from '../../core/utils/money';
import { OrderStatus } from '../../domain/entities/Order';
import { AuthForm } from '../../presentation/components/AuthForm';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { useStaff } from '../../presentation/providers/StaffProvider';
import { useTheme } from '../../presentation/providers/ThemeProvider';

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  pending: { label: 'Confirm', status: 'confirmed' },
  confirmed: { label: 'Start preparing', status: 'preparing' },
  preparing: { label: 'Ready for pickup', status: 'ready_for_pickup' },
  ready_for_pickup: { label: 'Complete', status: 'completed' },
  out_for_delivery: { label: 'Complete', status: 'completed' },
};

/** Staff incoming orders: advance status through the fulfillment pipeline. */
export default function StaffOrdersScreen() {
  const auth = useAuth();
  const staff = useStaff();
  const { palette } = useTheme();

  const pharmacyId = staff.selectedPharmacyId;

  useEffect(() => {
    if (pharmacyId) {
      staff.loadOrders(pharmacyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  if (!auth.user) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={[styles.title, { color: palette.ink }]}>Staff sign in required</Text>
        <View style={[styles.card, { backgroundColor: palette.card }]}>
          <AuthForm />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <FlatList
        data={staff.orders}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => {
          const next = NEXT_STATUS[item.status];
          const terminal = item.status === 'completed' || item.status === 'cancelled';
          return (
            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={styles.header}>
                <View style={styles.titles}>
                  <Text style={[styles.orderId, { color: palette.ink }]}>
                    Order {item.id.slice(0, 8)}… · {formatNaira(item.totalKobo)}
                  </Text>
                  <Text style={[styles.meta, { color: palette.muted }]}>
                    {item.createdAt.toLocaleDateString('en-NG')} ·{' '}
                    {item.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'} ·{' '}
                    {item.items.reduce((sum, line) => sum + line.quantity, 0)} items
                  </Text>
                </View>
                <Text
                  style={[styles.status, { backgroundColor: palette.brandSoft, color: palette.brandDark }]}
                >
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
              {item.items.map((line) => (
                <Text key={line.listingId} style={[styles.line, { color: palette.ink }]}>
                  {line.name} × {line.quantity}
                </Text>
              ))}
              {item.notes ? (
                <Text style={[styles.meta, { color: palette.muted }]}>Note: {item.notes}</Text>
              ) : null}
              {!terminal ? (
                <View style={styles.row}>
                  {next ? (
                    <Pressable
                      style={[styles.action, { backgroundColor: palette.brand }]}
                      onPress={() => staff.updateOrderStatus(item.id, next.status)}
                    >
                      <Text style={styles.actionText}>{next.label}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={[styles.action, styles.cancel, { borderColor: palette.danger }]}
                    onPress={() => staff.updateOrderStatus(item.id, 'cancelled')}
                  >
                    <Text style={[styles.actionText, { color: palette.danger }]}>Cancel</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: palette.muted }]}>
            {staff.loading ? 'Loading orders…' : 'No incoming orders for this pharmacy.'}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  titles: {
    flex: 1,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  line: {
    fontSize: 13,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  action: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
});
