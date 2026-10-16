import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { container } from '../../di/container';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { formatNaira, nairaToKobo } from '../../core/utils/money';
import { AuthForm } from '../../presentation/components/AuthForm';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { useStaff } from '../../presentation/providers/StaffProvider';
import { useTheme } from '../../presentation/providers/ThemeProvider';

type Draft = {
  brandName: string;
  genericName: string;
  strength: string;
  packSize: string;
  priceNaira: string;
  quantity: string;
};

/** Staff inventory: edit stock/price inline per listing. */
export default function StaffInventoryScreen() {
  const auth = useAuth();
  const staff = useStaff();
  const { palette } = useTheme();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const pharmacyId = staff.selectedPharmacyId;

  useEffect(() => {
    if (pharmacyId) {
      staff.loadListings(pharmacyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  function draftFor(listing: InventoryListing): Draft {
    return (
      drafts[listing.id] ?? {
        brandName: listing.brandName,
        genericName: listing.genericName,
        strength: listing.strength,
        packSize: listing.packSize,
        priceNaira: (listing.priceKobo / 100).toString(),
        quantity: listing.quantity.toString(),
      }
    );
  }

  function setDraft(listingId: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [listingId]: { ...(prev[listingId] ?? draftFor(staff.listings.find((l) => l.id === listingId)!)), ...patch },
    }));
  }

  async function handleSave(listing: InventoryListing) {
    const draft = draftFor(listing);
    const priceKobo = nairaToKobo(Number(draft.priceNaira));
    const quantity = Math.max(0, Math.floor(Number(draft.quantity)));
    if (!Number.isFinite(priceKobo) || priceKobo < 0 || !Number.isFinite(quantity)) {
      return;
    }
    setSavingId(listing.id);
    try {
      const result = await container.repositories.inventory.upsertListing({
        id: listing.id,
        pharmacyId: listing.pharmacyId,
        medicineId: listing.medicineId,
        brandName: draft.brandName.trim() || listing.brandName,
        genericName: draft.genericName.trim() || listing.genericName,
        form: listing.form,
        strength: draft.strength.trim(),
        nafdacNumber: listing.nafdacNumber,
        packSize: draft.packSize.trim(),
        quantity,
        priceKobo,
        currency: 'NGN',
        prescriptionRequired: listing.prescriptionRequired,
        expiryDate: listing.expiryDate,
        location: listing.location,
        state: listing.state,
        lga: listing.lga,
        city: listing.city,
        isAvailable: quantity > 0,
      });
      if (result.ok && pharmacyId) {
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[listing.id];
          return next;
        });
        await staff.loadListings(pharmacyId);
      }
    } finally {
      setSavingId(null);
    }
  }

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
        data={staff.listings}
        keyExtractor={(listing) => listing.id}
        renderItem={({ item }) => {
          const draft = draftFor(item);
          return (
            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.name, { color: palette.ink }]}>
                {item.brandName} ({item.genericName})
              </Text>
              <Text style={[styles.meta, { color: palette.muted }]}>
                Live: {formatNaira(item.priceKobo)} · {item.quantity} in stock
                {item.prescriptionRequired ? ' · Rx' : ''}
              </Text>
              <View style={styles.grid}>
                <TextInput
                  style={[styles.input, { borderColor: palette.border, color: palette.ink }]}
                  placeholder="Brand"
                  placeholderTextColor={palette.muted}
                  value={draft.brandName}
                  onChangeText={(value) => setDraft(item.id, { brandName: value })}
                />
                <TextInput
                  style={[styles.input, { borderColor: palette.border, color: palette.ink }]}
                  placeholder="Generic"
                  placeholderTextColor={palette.muted}
                  value={draft.genericName}
                  onChangeText={(value) => setDraft(item.id, { genericName: value })}
                  autoCapitalize="none"
                />
                <View style={styles.rowPair}>
                  <TextInput
                    style={[styles.input, styles.half, { borderColor: palette.border, color: palette.ink }]}
                    placeholder="Strength"
                    placeholderTextColor={palette.muted}
                    value={draft.strength}
                    onChangeText={(value) => setDraft(item.id, { strength: value })}
                  />
                  <TextInput
                    style={[styles.input, styles.half, { borderColor: palette.border, color: palette.ink }]}
                    placeholder="Pack size"
                    placeholderTextColor={palette.muted}
                    value={draft.packSize}
                    onChangeText={(value) => setDraft(item.id, { packSize: value })}
                  />
                </View>
                <View style={styles.rowPair}>
                  <TextInput
                    style={[styles.input, styles.half, { borderColor: palette.border, color: palette.ink }]}
                    placeholder="Price (₦)"
                    placeholderTextColor={palette.muted}
                    value={draft.priceNaira}
                    onChangeText={(value) => setDraft(item.id, { priceNaira: value })}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.half, { borderColor: palette.border, color: palette.ink }]}
                    placeholder="Qty"
                    placeholderTextColor={palette.muted}
                    value={draft.quantity}
                    onChangeText={(value) => setDraft(item.id, { quantity: value })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Pressable
                style={[styles.saveButton, { backgroundColor: palette.brand }]}
                onPress={() => handleSave(item)}
                disabled={savingId === item.id}
              >
                <Text style={styles.saveText}>{savingId === item.id ? 'Saving…' : 'Save changes'}</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: palette.muted }]}>
            {staff.loading ? 'Loading inventory…' : 'No listings for this pharmacy yet.'}
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
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  grid: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  rowPair: {
    flexDirection: 'row',
    gap: 8,
  },
  half: {
    flex: 1,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveText: {
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
