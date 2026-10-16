import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FLAT_DELIVERY_FEE_KOBO } from '../../core/config/checkout';
import { NigerianState } from '../../core/config/nigeria';
import { formatNaira } from '../../core/utils/money';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { FulfillmentType } from '../../domain/entities/Order';
import { DeliveryAddress } from '../../domain/entities/User';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { useCatalog } from '../../presentation/providers/CatalogProvider';
import { useConsultSheet } from '../../presentation/providers/consultSheetContext';
import { useOrders } from '../../presentation/providers/OrderProvider';
import { useTheme } from '../../presentation/providers/ThemeProvider';
import { container } from '../../di/container';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Combined pharmacy + product detail (per the §4.2 merge rule): the selected
 * listing and its pharmacy on one screen, with one primary action (Buy now).
 */
export default function ListingDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; listingId?: string; pharmacyId?: string }>();
  const listingId = first(params.listingId ?? params.id);
  const pharmacyIdParam = first(params.pharmacyId);

  const router = useRouter();
  const auth = useAuth();
  const catalog = useCatalog();
  const orders = useOrders();
  const { openConsult } = useConsultSheet();
  const { palette } = useTheme();

  const [listing, setListing] = useState<InventoryListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placedId, setPlacedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('pickup');
  const [notes, setNotes] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [lga, setLga] = useState('');
  const [addrState, setAddrState] = useState('Lagos');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

  const listingPharmacy = listing
    ? (catalog.pharmacies.find((p) => p.id === listing.pharmacyId) ?? catalog.selectedPharmacy)
    : null;
  const pickupAvailable = listingPharmacy ? listingPharmacy.pickupEnabled : true;
  const deliveryAvailable = listingPharmacy ? listingPharmacy.deliveryEnabled : true;

  // Derived during render (no effects): fall back to whichever fulfillment
  // method the pharmacy actually offers, then price from that.
  const effectiveFulfillment: FulfillmentType = listingPharmacy
    ? !listingPharmacy.pickupEnabled && listingPharmacy.deliveryEnabled
      ? 'delivery'
      : !listingPharmacy.deliveryEnabled && listingPharmacy.pickupEnabled
        ? 'pickup'
        : fulfillment
    : fulfillment;

  const maxQty = listing ? Math.max(1, listing.quantity) : 1;
  const clampedQty = Math.min(Math.max(1, quantity), maxQty);
  const deliveryFeeKobo = effectiveFulfillment === 'delivery' ? FLAT_DELIVERY_FEE_KOBO : 0;
  const subtotalKobo = listing ? listing.priceKobo * clampedQty : 0;
  const totalKobo = subtotalKobo + deliveryFeeKobo;

  const beyondRadius =
    effectiveFulfillment === 'delivery' &&
    listing != null &&
    listingPharmacy != null &&
    listing.distanceKm != null &&
    listing.distanceKm > listingPharmacy.deliveryRadiusKm;

  const savedAddresses = auth.user?.addresses ?? [];
  const defaultSavedAddress =
    savedAddresses.find((address) => address.isDefault) ?? savedAddresses[0] ?? null;
  const activeAddressId = selectedAddressId ?? defaultSavedAddress?.id ?? 'new';
  const useNewAddress = activeAddressId === 'new';

  async function handleBuy() {
    if (!auth.user || !listing || placing) {
      return;
    }
    setCheckoutError(null);
    if (listing.quantity <= 0) {
      setCheckoutError('This listing is out of stock.');
      return;
    }
    if (effectiveFulfillment === 'pickup' && !pickupAvailable) {
      setCheckoutError('Pickup is not offered by this pharmacy.');
      return;
    }
    let deliveryAddress: DeliveryAddress | null = null;
    let feeKobo = 0;
    if (effectiveFulfillment === 'delivery') {
      if (!deliveryAvailable) {
        setCheckoutError('Delivery is not offered by this pharmacy.');
        return;
      }
      if (beyondRadius) {
        setCheckoutError(
          `This pharmacy delivers within ${listingPharmacy?.deliveryRadiusKm ?? 0} km of its location.`,
        );
        return;
      }
      const saved = savedAddresses.find((address) => address.id === activeAddressId) ?? null;
      if (saved) {
        deliveryAddress = saved;
      } else {
        if (!street.trim() || !city.trim() || !lga.trim() || !addrState.trim()) {
          setCheckoutError('Enter a street, city, LGA, and state for delivery.');
          return;
        }
        deliveryAddress = {
          id: `new-${Date.now()}`,
          label: 'Delivery address',
          street: street.trim(),
          city: city.trim(),
          lga: lga.trim(),
          state: addrState.trim() as NigerianState,
          country: 'NG',
          isDefault: false,
        };
      }
      feeKobo = FLAT_DELIVERY_FEE_KOBO;
    }
    const subtotal = listing.priceKobo * clampedQty;
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
            quantity: clampedQty,
            unitPriceKobo: listing.priceKobo,
            lineTotalKobo: subtotal,
          },
        ],
        subtotalKobo: subtotal,
        deliveryFeeKobo: feeKobo,
        totalKobo: subtotal + feeKobo,
        currency: 'NGN',
        fulfillment: effectiveFulfillment,
        deliveryAddress,
        notes: notes.trim() || null,
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
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.muted }}>Loading…</Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.danger }}>{loadError ?? 'Listing not found.'}</Text>
      </View>
    );
  }

  const displayPharmacy = catalog.selectedPharmacy ?? pharmacy;
  const outOfStock = listing.quantity <= 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.brand, { color: palette.ink }]}>{listing.brandName}</Text>
      <Text style={[styles.generic, { color: palette.muted }]}>
        {listing.genericName} · {listing.strength} · {listing.packSize}
      </Text>
      {listing.prescriptionRequired ? (
        <Text style={[styles.rx, { backgroundColor: palette.accent }]}>Prescription required</Text>
      ) : null}

      <View style={[styles.card, { backgroundColor: palette.card }]}>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/pharmacy/[id]', params: { id: listing.pharmacyId } })
          }
        >
          <Text style={[styles.cardTitle, { color: palette.brandDark }]}>
            {displayPharmacy?.name ?? 'Pharmacy'} ›
          </Text>
        </Pressable>
        {displayPharmacy ? (
          <Text style={[styles.muted, { color: palette.muted }]}>
            PCN {displayPharmacy.pcnLicenseNumber} · ★ {displayPharmacy.ratingAvg.toFixed(1)} (
            {displayPharmacy.reviewCount})
          </Text>
        ) : null}
        <Text style={[styles.price, { color: palette.ink }]}>{formatNaira(listing.priceKobo)}</Text>
        <Text style={[styles.muted, { color: palette.muted }]}>
          {listing.distanceKm != null ? `${listing.distanceKm.toFixed(1)} km away · ` : ''}
          {outOfStock ? 'Out of stock' : `${listing.quantity} in stock`}
        </Text>
        {listing.nafdacNumber ? (
          <Text style={[styles.muted, { color: palette.muted }]}>NAFDAC {listing.nafdacNumber}</Text>
        ) : null}
        <View style={styles.row}>
          <Pressable
            style={[styles.secondaryButton, { borderColor: palette.brand }]}
            onPress={() =>
              openConsult({
                drug: `${listing.brandName} (${listing.genericName})`,
                pharmacyId: listing.pharmacyId,
              })
            }
          >
            <Text style={[styles.secondaryText, { color: palette.brand }]}>Ask about this</Text>
          </Pressable>
          {displayPharmacy?.phoneE164 ? (
            <Pressable style={[styles.secondaryButton, { borderColor: palette.brand }]} onPress={handleCall}>
              <Text style={[styles.secondaryText, { color: palette.brand }]}>Call</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {placedId ? (
        <View style={[styles.success, { backgroundColor: palette.card, borderLeftColor: palette.brand }]}>
          <Text style={[styles.successTitle, { color: palette.brandDark }]}>
            {effectiveFulfillment === 'delivery' ? 'Order placed for delivery' : 'Order placed for pickup'}
          </Text>
          <Text style={[styles.successBody, { color: palette.muted }]}>
            {effectiveFulfillment === 'delivery'
              ? `${displayPharmacy?.name ?? 'The pharmacy'} will deliver ${formatNaira(totalKobo)} (cash on delivery).`
              : `Show this at ${displayPharmacy?.name ?? 'the pharmacy'}.`}
          </Text>
          <Text style={[styles.successBody, { color: palette.muted }]}>Order {placedId.slice(0, 8)}…</Text>
          <View style={styles.successRow}>
            <Pressable
              style={[styles.secondaryButton, { borderColor: palette.brand }]}
              onPress={() => router.push('/orders')}
            >
              <Text style={[styles.secondaryText, { color: palette.brand }]}>View my orders</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          {!auth.user ? (
            <View style={[styles.card, { backgroundColor: palette.card }]}>
              <Text style={[styles.cardTitle, { color: palette.ink }]}>Sign in to buy</Text>
              <Text style={[styles.muted, { color: palette.muted }]}>
                Sign in or create a patient account, then come back here to place your order.
              </Text>
              <Pressable
                style={[styles.secondaryButton, { borderColor: palette.brand, marginTop: 8 }]}
                onPress={() => router.push('/onboarding/role')}
              >
                <Text style={[styles.secondaryText, { color: palette.brand }]}>Sign in or create account</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.cardTitle, { color: palette.ink }]}>Quantity</Text>
            <View style={styles.qtyRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
                style={[styles.qtyButton, { borderColor: palette.border }]}
                onPress={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={outOfStock || clampedQty <= 1}
              >
                <Text style={[styles.qtyText, { color: palette.ink }]}>−</Text>
              </Pressable>
              <Text style={[styles.qtyValue, { color: palette.ink }]}>{clampedQty}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                style={[styles.qtyButton, { borderColor: palette.border }]}
                onPress={() => setQuantity((current) => Math.min(maxQty, current + 1))}
                disabled={outOfStock || clampedQty >= maxQty}
              >
                <Text style={[styles.qtyText, { color: palette.ink }]}>+</Text>
              </Pressable>
              <Text style={[styles.muted, { color: palette.muted, marginTop: 0 }]}>
                {outOfStock ? 'Out of stock' : `${listing.quantity} available`}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.cardTitle, { color: palette.ink }]}>Pickup or delivery</Text>
            <View style={styles.row}>
              <Pressable
                style={[
                  styles.methodButton,
                  { borderColor: palette.border },
                  effectiveFulfillment === 'pickup' && { backgroundColor: palette.brandSoft, borderColor: palette.brand },
                ]}
                onPress={() => setFulfillment('pickup')}
                disabled={!pickupAvailable}
              >
                <Text
                  style={[styles.methodText, { color: effectiveFulfillment === 'pickup' ? palette.brandDark : palette.ink }]}
                >
                  Pickup · Free
                </Text>
                {!pickupAvailable ? (
                  <Text style={[styles.methodNote, { color: palette.muted }]}>Not offered</Text>
                ) : null}
              </Pressable>
              <Pressable
                style={[
                  styles.methodButton,
                  { borderColor: palette.border },
                  effectiveFulfillment === 'delivery' && { backgroundColor: palette.brandSoft, borderColor: palette.brand },
                ]}
                onPress={() => setFulfillment('delivery')}
                disabled={!deliveryAvailable}
              >
                <Text
                  style={[styles.methodText, { color: effectiveFulfillment === 'delivery' ? palette.brandDark : palette.ink }]}
                >
                  Delivery · {formatNaira(FLAT_DELIVERY_FEE_KOBO)}
                </Text>
                {!deliveryAvailable ? (
                  <Text style={[styles.methodNote, { color: palette.muted }]}>Not offered</Text>
                ) : null}
              </Pressable>
            </View>
            {beyondRadius ? (
              <Text style={[styles.muted, { color: palette.danger }]}>
                Outside this pharmacy&apos;s {listingPharmacy?.deliveryRadiusKm ?? 0} km delivery radius.
              </Text>
            ) : null}

            {effectiveFulfillment === 'delivery' ? (
              <View style={styles.addressBlock}>
                {savedAddresses.map((address) => (
                  <Pressable
                    key={address.id}
                    style={[
                      styles.addressOption,
                      { borderColor: palette.border },
                      activeAddressId === address.id && {
                        backgroundColor: palette.brandSoft,
                        borderColor: palette.brand,
                      },
                    ]}
                    onPress={() => setSelectedAddressId(address.id)}
                  >
                    <Text style={[styles.addressLabel, { color: palette.ink }]}>
                      {address.label}
                      {address.isDefault ? ' · Default' : ''}
                    </Text>
                    <Text style={[styles.muted, { color: palette.muted, marginTop: 0 }]}>
                      {address.street}, {address.city}, {address.lga}, {address.state}
                    </Text>
                  </Pressable>
                ))}
                {savedAddresses.length > 0 ? (
                  <Pressable
                    style={[
                      styles.addressOption,
                      { borderColor: palette.border },
                      useNewAddress && { backgroundColor: palette.brandSoft, borderColor: palette.brand },
                    ]}
                    onPress={() => setSelectedAddressId('new')}
                  >
                    <Text style={[styles.addressLabel, { color: palette.ink }]}>Use a different address</Text>
                  </Pressable>
                ) : null}
                {useNewAddress ? (
                  <>
                    <TextInput
                      style={[styles.input, { borderColor: palette.border, color: palette.ink }]}
                      placeholder="Street"
                      placeholderTextColor={palette.muted}
                      value={street}
                      onChangeText={setStreet}
                    />
                    <TextInput
                      style={[styles.input, { borderColor: palette.border, color: palette.ink }]}
                      placeholder="City"
                      placeholderTextColor={palette.muted}
                      value={city}
                      onChangeText={setCity}
                    />
                    <TextInput
                      style={[styles.input, { borderColor: palette.border, color: palette.ink }]}
                      placeholder="LGA"
                      placeholderTextColor={palette.muted}
                      value={lga}
                      onChangeText={setLga}
                    />
                    <TextInput
                      style={[styles.input, { borderColor: palette.border, color: palette.ink }]}
                      placeholder="State"
                      placeholderTextColor={palette.muted}
                      value={addrState}
                      onChangeText={setAddrState}
                    />
                  </>
                ) : null}
              </View>
            ) : null}

            <TextInput
              style={[styles.input, { borderColor: palette.border, color: palette.ink, marginTop: 8 }]}
              placeholder="Notes for the pharmacist (optional)"
              placeholderTextColor={palette.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.cardTitle, { color: palette.ink }]}>Order summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.muted, { color: palette.muted, marginTop: 0 }]}>
                {clampedQty} × {listing.brandName}
              </Text>
              <Text style={[styles.summaryValue, { color: palette.ink }]}>{formatNaira(subtotalKobo)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.muted, { color: palette.muted, marginTop: 0 }]}>
                {effectiveFulfillment === 'delivery' ? 'Delivery fee' : 'Pickup'}
              </Text>
              <Text style={[styles.summaryValue, { color: palette.ink }]}>{formatNaira(deliveryFeeKobo)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={[styles.summaryTotalLabel, { color: palette.ink }]}>Total</Text>
              <Text style={[styles.summaryTotalValue, { color: palette.ink }]}>{formatNaira(totalKobo)}</Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.buyButton,
              { backgroundColor: palette.brand },
              (!auth.user || outOfStock || placing || beyondRadius) && styles.disabled,
            ]}
            onPress={handleBuy}
            disabled={!auth.user || outOfStock || placing || beyondRadius}
          >
            <Text style={styles.buyText}>
              {outOfStock
                ? 'Out of stock'
                : placing
                  ? 'Placing order…'
                  : `Place order · ${formatNaira(totalKobo)} (cash on delivery)`}
            </Text>
          </Pressable>
          {checkoutError ? (
            <Text style={[styles.error, { color: palette.danger }]}>{checkoutError}</Text>
          ) : null}
          {orders.error ? (
            <Text style={[styles.error, { color: palette.danger }]}>{orders.error}</Text>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
  },
  generic: {
    fontSize: 14,
    marginTop: 4,
  },
  rx: {
    alignSelf: 'flex-start',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  muted: {
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
  buyButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  buyText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  error: {
    marginTop: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  qtyButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 22,
    fontWeight: '700',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  methodButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '700',
  },
  methodNote: {
    fontSize: 12,
    marginTop: 4,
  },
  addressBlock: {
    marginTop: 12,
    gap: 8,
  },
  addressOption: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryTotal: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D4DEEA',
    paddingTop: 12,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  summaryTotalValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  success: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  successBody: {
    fontSize: 13,
    marginTop: 4,
  },
  successRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
});
