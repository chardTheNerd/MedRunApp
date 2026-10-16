import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { container } from '../../di/container';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { Pharmacy } from '../../domain/entities/Pharmacy';
import { ListingCard } from '../../presentation/components/ListingCard';
import { PharmacyAvatar } from '../../presentation/components/PharmacyAvatar';
import { useCatalog } from '../../presentation/providers/CatalogProvider';
import { useConsultSheet } from '../../presentation/providers/consultSheetContext';
import { useTheme } from '../../presentation/providers/ThemeProvider';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatHours(pharmacy: Pharmacy): string {
  const today = new Date()
    .toLocaleDateString('en-NG', { weekday: 'short' })
    .toLowerCase() as keyof Pharmacy['operatingHours'];
  const hours = pharmacy.operatingHours[today];
  if (!hours) {
    return 'Closed today';
  }
  return `Open today ${hours.open}–${hours.close}`;
}

/** Pharmacy profile: circular avatar, verified badge, info, and listings. */
export default function PharmacyDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; pharmacyId?: string }>();
  const pharmacyId = first(params.pharmacyId ?? params.id);
  const router = useRouter();
  const catalog = useCatalog();
  const { openConsult } = useConsultSheet();
  const { palette } = useTheme();

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [listings, setListings] = useState<InventoryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!pharmacyId) {
        setLoadError('No pharmacy was selected.');
        setLoading(false);
        return;
      }
      const cached =
        catalog.pharmacies.find((item) => item.id === pharmacyId) ?? catalog.selectedPharmacy;
      if (cached && cached.id === pharmacyId) {
        setPharmacy(cached);
      }
      const [pharmacyResult, listingsResult] = await Promise.all([
        container.repositories.pharmacies.getById(pharmacyId),
        container.repositories.inventory.listByPharmacy(pharmacyId),
      ]);
      if (!pharmacyResult.ok) {
        if (!cached || cached.id !== pharmacyId) {
          setLoadError(pharmacyResult.error.message);
        }
      } else {
        setPharmacy(pharmacyResult.value);
      }
      if (listingsResult.ok) {
        setListings(listingsResult.value.filter((item) => item.isAvailable && item.quantity > 0));
      } else if (!listingsResult.ok && listings.length === 0) {
        setLoadError((prev) => prev ?? listingsResult.error.message);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  function handleOpen(listing: InventoryListing) {
    router.push({ pathname: '/listing/[id]', params: { id: listing.id } });
  }

  function handleAsk(listing: InventoryListing) {
    openConsult({
      drug: `${listing.brandName} (${listing.genericName})`,
      pharmacyId: listing.pharmacyId,
    });
  }

  function handleCall() {
    if (pharmacy?.phoneE164) {
      Linking.openURL(`tel:${pharmacy.phoneE164}`);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.muted }}>Loading pharmacy…</Text>
      </View>
    );
  }

  if (!pharmacy) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.danger }}>{loadError ?? 'Pharmacy not found.'}</Text>
      </View>
    );
  }

  const verified = pharmacy.verificationStatus === 'verified';
  const fulfillment = [
    pharmacy.pickupEnabled ? 'Pickup' : null,
    pharmacy.deliveryEnabled ? `Delivery (within ${pharmacy.deliveryRadiusKm} km)` : null,
  ].filter(Boolean);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <FlatList
        data={listings}
        keyExtractor={(listing) => listing.id}
        renderItem={({ item }) => (
          <ListingCard listing={item} pharmacy={pharmacy} onAsk={handleAsk} onOpen={handleOpen} />
        )}
        ListHeaderComponent={
          <View style={[styles.profile, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.identity}>
              <PharmacyAvatar name={pharmacy.name} />
              <View style={styles.names}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: palette.ink }]}>{pharmacy.name}</Text>
                  {verified ? (
                    <Text
                      style={[styles.badge, { backgroundColor: palette.brandSoft, color: palette.brandDark }]}
                    >
                      ✓ Verified
                    </Text>
                  ) : (
                    <Text
                      style={[styles.badge, { backgroundColor: palette.surface, color: palette.muted }]}
                    >
                      {pharmacy.verificationStatus}
                    </Text>
                  )}
                </View>
                <Text style={[styles.meta, { color: palette.muted }]}>
                  PCN {pharmacy.pcnLicenseNumber} · ★ {pharmacy.ratingAvg.toFixed(1)} (
                  {pharmacy.reviewCount})
                </Text>
                <Text style={[styles.meta, { color: palette.muted }]}>
                  {pharmacy.address.street}, {pharmacy.address.city}, {pharmacy.address.lga},{' '}
                  {pharmacy.address.state}
                </Text>
                <Text style={[styles.meta, { color: palette.muted }]}>{formatHours(pharmacy)}</Text>
              </View>
            </View>

            {fulfillment.length > 0 ? (
              <Text style={[styles.meta, { color: palette.muted, marginTop: 8 }]}>
                {fulfillment.join(' · ')}
              </Text>
            ) : null}

            <View style={styles.row}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: palette.brand }]}
                onPress={() => openConsult({ pharmacyId: pharmacy.id })}
              >
                <Text style={[styles.secondaryText, { color: palette.brand }]}>Ask a pharmacist</Text>
              </Pressable>
              {pharmacy.phoneE164 ? (
                <Pressable
                  style={[styles.secondaryButton, { borderColor: palette.brand }]}
                  onPress={handleCall}
                >
                  <Text style={[styles.secondaryText, { color: palette.brand }]}>Call</Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={[styles.sectionTitle, { color: palette.ink }]}>
              Available medicines ({listings.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          loadError ? (
            <Text style={[styles.empty, { color: palette.danger }]}>{loadError}</Text>
          ) : (
            <Text style={[styles.empty, { color: palette.muted }]}>
              No medicines currently in stock at this pharmacy.
            </Text>
          )
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
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  profile: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  identity: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  names: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  meta: {
    fontSize: 13,
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
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 16,
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 24,
  },
});
