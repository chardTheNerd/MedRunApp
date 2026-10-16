import { StyleSheet, Text, View } from 'react-native';
import { formatNaira } from '../../core/utils/money';
import { Order } from '../../domain/entities/Order';
import { useTheme } from '../providers/ThemeProvider';

type OrderCardProps = {
  order: Order;
  pharmacyName?: string;
};

function formatStatus(status: Order['status']): string {
  const words = status.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** One order in the patient order history: items, totals, status, fulfillment. */
export function OrderCard({ order, pharmacyName }: OrderCardProps) {
  const { palette } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={[styles.pharmacy, { color: palette.ink }]}>{pharmacyName ?? 'Pharmacy'}</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>
            {order.createdAt.toLocaleDateString('en-NG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}{' '}
            · Order {order.id.slice(0, 8)}…
          </Text>
        </View>
        <Text
          style={[styles.status, { backgroundColor: palette.brandSoft, color: palette.brandDark }]}
        >
          {formatStatus(order.status)}
        </Text>
      </View>

      {order.items.map((item) => (
        <View key={item.listingId} style={styles.itemRow}>
          <Text style={[styles.itemName, { color: palette.ink }]}>
            {item.name} × {item.quantity}
          </Text>
          <Text style={[styles.itemPrice, { color: palette.ink }]}>
            {formatNaira(item.lineTotalKobo)}
          </Text>
        </View>
      ))}

      <View style={styles.totals}>
        <Text style={[styles.meta, { color: palette.muted }]}>
          {order.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'} ·{' '}
          {order.payment.method.replace(/_/g, ' ')} · {order.payment.status}
        </Text>
        <Text style={[styles.total, { color: palette.ink }]}>
          Total {formatNaira(order.totalKobo)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 8,
  },
  titles: {
    flex: 1,
  },
  pharmacy: {
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  totals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  total: {
    fontSize: 15,
    fontWeight: '800',
  },
});
