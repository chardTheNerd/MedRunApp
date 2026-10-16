import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatNaira } from '../../core/utils/money';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { Pharmacy } from '../../domain/entities/Pharmacy';
import { useTheme } from '../providers/ThemeProvider';

type ListingCardProps = {
  listing: InventoryListing;
  pharmacy?: Pharmacy;
  onAsk: (listing: InventoryListing) => void;
  onOpen: (listing: InventoryListing) => void;
  onPharmacy?: (pharmacyId: string) => void;
};

export function ListingCard({ listing, pharmacy, onAsk, onOpen, onPharmacy }: ListingCardProps) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={() => onOpen(listing)}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={[styles.brand, { color: palette.ink }]}>{listing.brandName}</Text>
          <Text style={[styles.generic, { color: palette.muted }]}>
            {listing.genericName} · {listing.strength} · {listing.packSize}
          </Text>
        </View>
        {listing.prescriptionRequired ? (
          <Text style={[styles.rx, { backgroundColor: palette.accent }]}>Rx</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => (pharmacy && onPharmacy ? onPharmacy(pharmacy.id) : onOpen(listing))}
      >
        <Text style={[styles.pharmacy, { color: palette.brandDark }]}>
          {pharmacy?.name ?? 'Pharmacy'}
        </Text>
      </Pressable>
      {pharmacy ? (
        <Text style={[styles.meta, { color: palette.muted }]}>
          PCN {pharmacy.pcnLicenseNumber} · ★ {pharmacy.ratingAvg.toFixed(1)} ({pharmacy.reviewCount})
        </Text>
      ) : null}
      {listing.nafdacNumber ? (
        <Text style={[styles.meta, { color: palette.muted }]}>NAFDAC {listing.nafdacNumber}</Text>
      ) : null}

      <View style={styles.footer}>
        <View>
          <Text style={[styles.price, { color: palette.ink }]}>{formatNaira(listing.priceKobo)}</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>
            {listing.distanceKm != null ? `${listing.distanceKm.toFixed(1)} km away` : 'Distance unknown'} ·{' '}
            {listing.quantity > 0 ? `${listing.quantity} in stock` : 'Out of stock'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ask a pharmacist about ${listing.brandName}`}
          onPress={() => onAsk(listing)}
          style={[styles.askButton, { backgroundColor: palette.brand }]}
        >
          <Text style={styles.askText}>Ask about this</Text>
        </Pressable>
      </View>
    </Pressable>
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
  },
  titles: {
    flex: 1,
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
  },
  generic: {
    fontSize: 13,
    marginTop: 2,
  },
  rx: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  pharmacy: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  meta: {
    fontSize: 12,
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
  },
  askButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  askText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
