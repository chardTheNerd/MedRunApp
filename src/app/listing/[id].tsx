import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../core/theme/colors';
import { formatNaira } from '../../core/utils/money';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { AuthForm } from '../../presentation/components/AuthForm';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { useCatalog } from '../../presentation/providers/CatalogProvider';
import { useConsultSheet } from '../../presentation/providers/consultSheetContext';
import { useOrders } from '../../presentation/providers/OrderProvider';
import { container } from '../../di/container';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Combined pharmacy + product detail (per the §4.2 merge rule): the selected
 * listing and its pharmacy on one screen, with one primary action (Buy now).
 */
export default function ListingDetailScreen() {
  const params = useLocalSearchParams<{ listingId?: string; pharmacyId?: string }>();
  const listingId = first(params.listingId);
  const pharmacyIdParam = first(params.pharmacyId);

  const auth = useAuth();
  const catalog = useCatalog();
  const orders = useOrders();
  const { openConsult } = useConsultSheet();

  const [listing, setListing] = useState<InventoryListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placedId, setPlacedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!listingId) {
        setLoadError('No listing was selected.');
        setLoading(false);
        return;
      }
      const cached = catalog.listings.find((item) => item.id === listingId);
      if (cached) {
        setListing(cached);
      }
      const result = await container.repositories.inventory.listByPharmacy(
        cached?.pharmacyId ?? pharmacyIdParam ?? '',
      );
      if (!result.ok) {
        if (!cached) {
          setLoadError(result.error.message);
        }
      } else {
        const found = result.value.find((item) => item.id === listingId) ?? null;
        if (found) {
          setListing(found);
        } else if (!cached) {
          setLoadError('This listing is no longer available.');
        }
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const pharmacy = useMemo(() => {
    if (!listing) {
      return null;
    }
    return catalog.pharmacies.find((p) => p.id === listing.pharmacyId) ?? null;
  }, [catalog.pharmacies, listing]);

  useEffect(() => {
    if (listing && !pharmacy) {
      catalog.loadPharmacy(listing.pharmacyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.pharmacyId]);

  async function handleBuy() {
    if (!auth.user || !listing || placing) {
      return;
    }
    setPlacing(true);
    try {
      const order = await orders.place({
        patientId: auth.user.id,
        pharmacyId: listing.pharmacyId,
        items: [
          {
            listingId: listing.id,
            medicineId: listing.medicineId,
            name: `${listing.brandName} (${listing.genericName})`,
            quantity: 1,
            unitPriceKobo: listing.priceKobo,
            lineTotalKobo: listing.priceKobo,
          },
        ],
        subtotalKobo: listing.priceKobo,
        deliveryFeeKobo: 0,
        totalKobo: listing.priceKobo,
        currency: 'NGN',
        fulfillment: 'pickup',
        deliveryAddress: null,
        notes: null,
        payment: { method: 'cash_on_delivery', status: 'unpaid', reference: null },
      });
      if (order) {
        setPlacedId(order.id);
      }
    } finally {
      setPlacing(false);
    }
  }

  function handleCall() {
    const phone = catalog.selectedPharmacy?.phoneE164 ?? pharmacy?.phoneE164;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{loadError ?? 'Listing not found.'}</Text>
      </View>
    );
  }

  const displayPharmacy = catalog.selectedPharmacy ?? pharmacy;
  const outOfStock = listing.quantity <= 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>{listing.brandName}</Text>
      <Text style={styles.generic}>
        {listing.genericName} · {listing.strength} · {listing.packSize}
      </Text>
      {listing.prescriptionRequired ? <Text style={styles.rx}>Prescription required</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{displayPharmacy?.name ?? 'Pharmacy'}</Text>
        {displayPharmacy ? (
          <Text style={styles.muted}>
            PCN {displayPharmacy.pcnLicenseNumber} · ★ {displayPharmacy.ratingAvg.toFixed(1)} (
            {displayPharmacy.reviewCount})
          </Text>
        ) : null}
        <Text style={styles.price}>{formatNaira(listing.priceKobo)}</Text>
        <Text style={styles.muted}>
          {listing.distanceKm != null ? `${listing.distanceKm.toFixed(1)} km away · ` : ''}
          {outOfStock ? 'Out of stock' : `${listing.quantity} in stock`}
        </Text>
        {listing.nafdacNumber ? <Text style={styles.muted}>NAFDAC {listing.nafdacNumber}</Text> : null}
        <View style={styles.row}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              openConsult({
                drug: `${listing.brandName} (${listing.genericName})`,
                pharmacyId: listing.pharmacyId,
              })
            }
          >
            <Text style={styles.secondaryText}>Ask about this</Text>
          </Pressable>
          {displayPharmacy?.phoneE164 ? (
            <Pressable style={styles.secondaryButton} onPress={handleCall}>
              <Text style={styles.secondaryText}>Call</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {placedId ? (
        <View style={styles.success}>
          <Text style={styles.successTitle}>Order placed for pickup</Text>
          <Text style={styles.successBody}>Show this at {displayPharmacy?.name ?? 'the pharmacy'}.</Text>
          <Text style={styles.successBody}>Order {placedId.slice(0, 8)}…</Text>
        </View>
      ) : (
        <>
          {!auth.user ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign in to buy</Text>
              <AuthForm />
            </View>
          ) : null}
          <Pressable
            style={[styles.buyButton, (!auth.user || outOfStock || placing) && styles.disabled]}
            onPress={handleBuy}
            disabled={!auth.user || outOfStock || placing}
          >
            <Text style={styles.buyText}>
              {outOfStock ? 'Out of stock' : placing ? 'Placing order…' : `Buy now · ${formatNaira(listing.priceKobo)}`}
            </Text>
          </Pressable>
          {orders.error ? <Text style={styles.error}>{orders.error}</Text> : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
  },
  generic: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  rx: {
    alignSelf: 'flex-start',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 8,
  },
  muted: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.brand,
    fontWeight: '700',
    fontSize: 14,
  },
  buyButton: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  buyText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  error: {
    marginTop: 8,
    color: colors.danger,
  },
  success: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.brand,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.brandDark,
  },
  successBody: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
});
