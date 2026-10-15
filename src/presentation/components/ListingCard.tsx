import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../core/theme/colors';
import { formatNaira } from '../../core/utils/money';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { Pharmacy } from '../../domain/entities/Pharmacy';

type ListingCardProps = {
  listing: InventoryListing;
  pharmacy?: Pharmacy;
  onAsk: (listing: InventoryListing) => void;
};

export function ListingCard({ listing, pharmacy, onAsk }: ListingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={styles.brand}>{listing.brandName}</Text>
          <Text style={styles.generic}>
            {listing.genericName} · {listing.strength} · {listing.packSize}
          </Text>
        </View>
        {listing.prescriptionRequired ? <Text style={styles.rx}>Rx</Text> : null}
      </View>

      <Text style={styles.pharmacy}>{pharmacy?.name ?? 'Pharmacy'}</Text>
      {pharmacy ? (
        <Text style={styles.meta}>
          PCN {pharmacy.pcnLicenseNumber} · ★ {pharmacy.ratingAvg.toFixed(1)} ({pharmacy.reviewCount})
        </Text>
      ) : null}

      <View style={styles.footer}>
        <View>
          <Text style={styles.price}>{formatNaira(listing.priceKobo)}</Text>
          <Text style={styles.meta}>
            {listing.distanceKm != null ? `${listing.distanceKm.toFixed(1)} km away` : 'Distance unknown'} ·{' '}
            {listing.quantity > 0 ? `${listing.quantity} in stock` : 'Out of stock'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ask a pharmacist about ${listing.brandName}`}
          onPress={() => onAsk(listing)}
          style={styles.askButton}
        >
          <Text style={styles.askText}>Ask about this</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titles: {
    flex: 1,
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  generic: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  rx: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  pharmacy: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brandDark,
    marginTop: 8,
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  askButton: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  askText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
