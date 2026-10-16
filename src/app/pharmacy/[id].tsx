import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { directionsUrl } from '../../core/utils/maps';
import { container } from '../../di/container';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { Pharmacy } from '../../domain/entities/Pharmacy';
import { PharmacyReview } from '../../domain/entities/PharmacyReview';
import { AuthForm } from '../../presentation/components/AuthForm';
import { ListingCard } from '../../presentation/components/ListingCard';
import { PharmacyAvatar } from '../../presentation/components/PharmacyAvatar';
import { ReviewCard } from '../../presentation/components/ReviewCard';
import { ReviewForm } from '../../presentation/components/ReviewForm';
import { useAuth } from '../../presentation/providers/AuthProvider';
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
  const auth = useAuth();
  const catalog = useCatalog();
  const { openConsult } = useConsultSheet();
  const { palette } = useTheme();

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [listings, setListings] = useState<InventoryListing[]>([]);
  const [reviews, setReviews] = useState<PharmacyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  async function loadReviews(id: string) {
    const result = await container.repositories.reviews.listForPharmacy(id);
    if (!result.ok) {
      setReviewsError(result.error.message);
      return;
    }
    setReviewsError(null);
    setReviews(result.value);
  }

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
      const [pharmacyResult, listingsResult, reviewsResult] = await Promise.all([
        container.repositories.pharmacies.getById(pharmacyId),
        container.repositories.inventory.listByPharmacy(pharmacyId),
        container.repositories.reviews.listForPharmacy(pharmacyId),
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
      if (reviewsResult.ok) {
        setReviews(reviewsResult.value);
      } else {
        setReviewsError(reviewsResult.error.message);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  async function handleSubmitReview(rating: number, comment: string): Promise<boolean> {
    if (!auth.user || !pharmacyId) {
      return false;
    }
    setSubmittingReview(true);
    try {
      const result = await container.repositories.reviews.submit({
        pharmacyId,
        patientId: auth.user.id,
        authorName: auth.user.displayName,
        rating,
        comment,
      });
      if (!result.ok) {
        setReviewsError(result.error.message);
        return false;
      }
      setShowReviewForm(false);
      await loadReviews(pharmacyId);
      const refreshed = await container.repositories.pharmacies.getById(pharmacyId);
      if (refreshed.ok) {
        setPharmacy(refreshed.value);
      }
      return true;
    } finally {
      setSubmittingReview(false);
    }
  }

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

  function handleDirections() {
    if (pharmacy) {
      Linking.openURL(
        directionsUrl(pharmacy.location.latitude, pharmacy.location.longitude),
      );
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
            <Pressable
              style={[styles.secondaryButton, { borderColor: palette.brand, marginTop: 8 }]}
              onPress={handleDirections}
            >
              <Text style={[styles.secondaryText, { color: palette.brand }]}>Get directions</Text>
            </Pressable>

            <Text style={[styles.sectionTitle, { color: palette.ink }]}>
              Reviews ({pharmacy.reviewCount})
            </Text>
            {reviews.slice(0, 5).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {reviewsError ? (
              <Text style={[styles.meta, { color: palette.danger }]}>{reviewsError}</Text>
            ) : null}
            {reviews.length === 0 && !reviewsError ? (
              <Text style={[styles.meta, { color: palette.muted }]}>
                No reviews yet — be the first to rate this pharmacy.
              </Text>
            ) : null}
            {auth.user ? (
              showReviewForm ? (
                <ReviewForm submitting={submittingReview} onSubmit={handleSubmitReview} />
              ) : (
                <Pressable
                  style={[styles.secondaryButton, { borderColor: palette.brand, marginTop: 8 }]}
                  onPress={() => setShowReviewForm(true)}
                >
                  <Text style={[styles.secondaryText, { color: palette.brand }]}>Write a review</Text>
                </Pressable>
              )
            ) : (
              <View style={[styles.authCard, { backgroundColor: palette.surface }]}>
                <Text style={[styles.meta, { color: palette.muted }]}>
                  Sign in to write a review.
                </Text>
                <AuthForm />
              </View>
            )}

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
  authCard: {
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
});
