import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { isSupabaseConfigured } from '../core/config/env';
import { NIGERIAN_STATES } from '../core/config/nigeria';
import { GeoCoordinate } from '../core/types/geo';
import { InventoryListing } from '../domain/entities/InventoryListing';
import { Pharmacy } from '../domain/entities/Pharmacy';
import { AuthForm } from '../presentation/components/AuthForm';
import { ListingCard } from '../presentation/components/ListingCard';
import { useAuth } from '../presentation/providers/AuthProvider';
import { useCatalog } from '../presentation/providers/CatalogProvider';
import { useConsultSheet } from '../presentation/providers/consultSheetContext';
import { useTheme } from '../presentation/providers/ThemeProvider';

const LAGOS_FALLBACK: GeoCoordinate = { latitude: 6.5244, longitude: 3.3792 };

export default function HomeScreen() {
  const router = useRouter();
  const { openConsult } = useConsultSheet();
  const { palette, mode, toggle } = useTheme();
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
    await catalog.searchListings({ center, radiusKm: 50, genericName: query.trim() });
    await catalog.searchPharmacies({ center, radiusKm: 50 });
  }

  const signedIn = auth.status === 'authenticated';
  const emptyMessage = !signedIn
    ? 'Sign in below to search nearby pharmacies.'
    : catalog.loading
      ? 'Searching pharmacies near you…'
      : `No matches within 50 km of Lagos. Try another spelling or the generic name.`;

  function handleOpen(listing: InventoryListing) {
    router.push({ pathname: '/listing/[id]', params: { id: listing.id } });
  }

  function handleAsk(listing: InventoryListing) {
    openConsult({
      drug: `${listing.brandName} (${listing.genericName})`,
      pharmacyId: listing.pharmacyId,
    });
  }

  function handlePharmacy(pharmacyId: string) {
    router.push({ pathname: '/pharmacy/[id]', params: { id: pharmacyId } });
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={[styles.searchSection, { backgroundColor: palette.brand }]}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Find your medicine nearby</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onPress={toggle}
            style={styles.themeToggle}
          >
            <Text style={styles.themeToggleText}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Search brand or generic names — e.g. Panadol, paracetamol, Augmentin.
        </Text>
        <TextInput
          style={[styles.searchInput, { backgroundColor: palette.card, color: palette.ink }]}
          placeholder="Drug name (brand or generic)"
          placeholderTextColor={palette.muted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          editable={!catalog.loading}
        />
        <Pressable
          style={[
            styles.searchButton,
            { backgroundColor: palette.brandDark },
            (!query.trim() || !center || !signedIn) && styles.buttonDisabled,
          ]}
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
        {catalog.error ? (
          <Text style={[styles.error, { color: palette.danger }]}>{catalog.error}</Text>
        ) : null}
      </View>

      <FlatList
        data={catalog.listings}
        keyExtractor={(listing) => listing.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            pharmacy={pharmacyById.get(item.pharmacyId)}
            onAsk={handleAsk}
            onOpen={handleOpen}
            onPharmacy={handlePharmacy}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: palette.muted }]}>{emptyMessage}</Text>
        }
        ListFooterComponent={
          <View style={[styles.account, { backgroundColor: palette.card }]}>
            <Text style={[styles.accountTitle, { color: palette.ink }]}>Account</Text>
            <AuthForm />
            {signedIn ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View my orders"
                  onPress={() => router.push('/orders')}
                  style={[styles.ordersButton, { backgroundColor: palette.brand }]}
                >
                  <Text style={styles.ordersButtonText}>View my orders</Text>
                </Pressable>
                {auth.user?.role !== 'patient' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open staff dashboard"
                    onPress={() => router.push('/staff')}
                    style={[styles.ordersButton, { backgroundColor: palette.brandDark }]}
                  >
                    <Text style={styles.ordersButtonText}>Staff dashboard</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
            <Text style={[styles.coverage, { color: palette.muted }]}>
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
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeToggle: {
    padding: 6,
  },
  themeToggleText: {
    fontSize: 20,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 4,
    marginBottom: 12,
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  searchButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  notice: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 12,
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 24,
  },
  account: {
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 80,
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  ordersButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  ordersButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  coverage: {
    fontSize: 12,
    marginTop: 12,
  },
});
