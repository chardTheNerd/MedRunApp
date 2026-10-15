import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { env, isSupabaseConfigured } from '../core/config/env';
import { NIGERIAN_STATES } from '../core/config/nigeria';
import { colors } from '../core/theme/colors';
import { GeoCoordinate } from '../core/types/geo';
import { InventoryListing } from '../domain/entities/InventoryListing';
import { Pharmacy } from '../domain/entities/Pharmacy';
import { AuthForm } from '../presentation/components/AuthForm';
import { ListingCard } from '../presentation/components/ListingCard';
import { useAuth } from '../presentation/providers/AuthProvider';
import { useCatalog } from '../presentation/providers/CatalogProvider';
import { useConsultSheet } from '../presentation/providers/consultSheetContext';

const LAGOS_FALLBACK: GeoCoordinate = { latitude: 6.5244, longitude: 3.3792 };

export default function HomeScreen() {
  const { openConsult } = useConsultSheet();
  const auth = useAuth();
  const catalog = useCatalog();
  const [query, setQuery] = useState('');
  const [center, setCenter] = useState<GeoCoordinate | null>(null);
  const [locating, setLocating] = useState(true);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  useEffect(() => {
    async function locate() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          setCenter(LAGOS_FALLBACK);
          setLocationNotice('Location permission denied — showing results for Lagos.');
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        setCenter({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      } catch {
        setCenter(LAGOS_FALLBACK);
        setLocationNotice('Could not get your location — showing results for Lagos.');
      } finally {
        setLocating(false);
      }
    }
    locate();
  }, []);

  const pharmacies = catalog.pharmacies;
  const pharmacyById = useMemo(() => {
    const map = new Map<string, Pharmacy>();
    for (const pharmacy of pharmacies) {
      map.set(pharmacy.id, pharmacy);
    }
    return map;
  }, [pharmacies]);

  async function handleSearch() {
    if (!query.trim() || !center) {
      return;
    }
    await catalog.searchListings({ center, radiusKm: env.searchRadiusKm, genericName: query.trim() });
    await catalog.searchPharmacies({ center, radiusKm: env.searchRadiusKm });
  }

  const signedIn = auth.status === 'authenticated';
  const emptyMessage = !signedIn
    ? 'Sign in below to search nearby pharmacies.'
    : catalog.loading
      ? 'Searching pharmacies near you…'
      : `No matches within ${env.searchRadiusKm} km. Try another spelling or the generic name.`;

  function handleAsk(listing: InventoryListing) {
    openConsult({
      drug: `${listing.brandName} (${listing.genericName})`,
      pharmacyId: listing.pharmacyId,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <Text style={styles.title}>Find your medicine nearby</Text>
        <Text style={styles.subtitle}>
          Search brand or generic names — e.g. Panadol, paracetamol, Augmentin.
        </Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Drug name (brand or generic)"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          editable={!catalog.loading}
        />
        <Pressable
          style={[styles.searchButton, (!query.trim() || !center || !signedIn) && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={!query.trim() || !center || !signedIn}
        >
          <Text style={styles.searchButtonText}>
            {catalog.loading ? 'Searching…' : locating ? 'Locating…' : 'Search nearby'}
          </Text>
        </Pressable>
        {locationNotice ? <Text style={styles.notice}>{locationNotice}</Text> : null}
        {!isSupabaseConfigured() ? (
          <Text style={styles.error}>Supabase keys not set — connect a backend to search.</Text>
        ) : null}
        {catalog.error ? <Text style={styles.error}>{catalog.error}</Text> : null}
      </View>

      <FlatList
        data={catalog.listings}
        keyExtractor={(listing) => listing.id}
        renderItem={({ item }) => (
          <ListingCard listing={item} pharmacy={pharmacyById.get(item.pharmacyId)} onAsk={handleAsk} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{emptyMessage}</Text>
        }
        ListFooterComponent={
          <View style={styles.account}>
            <Text style={styles.accountTitle}>Account</Text>
            <AuthForm />
            <Text style={styles.coverage}>
              Coverage: {NIGERIAN_STATES.length} states including FCT ·{' '}
              {auth.status === 'authenticated' ? `Signed in as ${auth.user?.displayName}` : 'Signed out'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  searchSection: {
    backgroundColor: colors.brand,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  subtitle: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.85,
    marginTop: 4,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
  },
  searchButton: {
    backgroundColor: colors.brandDark,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  notice: {
    marginTop: 8,
    color: colors.white,
    fontSize: 12,
  },
  error: {
    marginTop: 8,
    color: '#FFD6D6',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
    marginTop: 24,
  },
  account: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 80,
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  coverage: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 12,
  },
});
