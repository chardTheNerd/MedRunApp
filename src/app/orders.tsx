import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { container } from '../di/container';
import { OrderCard } from '../presentation/components/OrderCard';
import { useAuth } from '../presentation/providers/AuthProvider';
import { useCatalog } from '../presentation/providers/CatalogProvider';
import { useOrders } from '../presentation/providers/OrderProvider';
import { useTheme } from '../presentation/providers/ThemeProvider';

/** Patient order history: every order placed from the listing screens. */
export default function OrdersScreen() {
  const router = useRouter();
  const auth = useAuth();
  const orders = useOrders();
  const catalog = useCatalog();
  const { palette } = useTheme();
  const [pharmacyNames, setPharmacyNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (auth.user) {
      orders.loadPatientOrders(auth.user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.id]);

  useEffect(() => {
    const missing = new Set<string>();
    for (const order of orders.orders) {
      const cached = catalog.pharmacies.find((p) => p.id === order.pharmacyId);
      if (!cached && !pharmacyNames[order.pharmacyId]) {
        missing.add(order.pharmacyId);
      }
    }
    if (missing.size === 0) {
      return;
    }
    let cancelled = false;
    (async () => {
      const resolved: Record<string, string> = {};
      for (const pharmacyId of missing) {
        const result = await container.repositories.pharmacies.getById(pharmacyId);
        if (result.ok) {
          resolved[pharmacyId] = result.value.name;
        }
      }
      if (!cancelled && Object.keys(resolved).length > 0) {
        setPharmacyNames((prev) => ({ ...prev, ...resolved }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.orders, catalog.pharmacies]);

  function pharmacyNameFor(pharmacyId: string): string | undefined {
    return (
      catalog.pharmacies.find((p) => p.id === pharmacyId)?.name ?? pharmacyNames[pharmacyId]
    );
  }

  function handleRefresh() {
    if (auth.user) {
      orders.loadPatientOrders(auth.user.id);
    }
  }

  if (!auth.user) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={[styles.title, { color: palette.ink }]}>Sign in to see your orders</Text>
        <Text style={[styles.body, { color: palette.muted }]}>
          Orders are linked to your account so you can track pickup and delivery.
        </Text>
        <Pressable
          style={[styles.signIn, { backgroundColor: palette.brand }]}
          onPress={() => router.push('/onboarding/role')}
        >
          <Text style={styles.signInText}>Sign in or create account</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
          style={styles.link}
        >
          <Text style={[styles.linkText, { color: palette.brand }]}>← Back to search</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <FlatList
        data={orders.orders}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => (
          <OrderCard order={item} pharmacyName={pharmacyNameFor(item.pharmacyId)} />
        )}
        refreshing={orders.loading}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          orders.loading ? (
            <Text style={[styles.empty, { color: palette.muted }]}>Loading your orders…</Text>
          ) : (
            <Text style={[styles.empty, { color: palette.muted }]}>
              No orders yet. Find a medicine nearby and tap Buy now.
            </Text>
          )
        }
        ListFooterComponent={
          orders.error ? (
            <Text style={[styles.error, { color: palette.danger }]}>{orders.error}</Text>
          ) : null
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
  },
  body: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 14,
  },
  link: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
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
  signIn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  signInText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
  },
});
