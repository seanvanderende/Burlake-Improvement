import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useListCollections, useListProducts } from '@workspace/api-client-react';
import type { Collection, Product } from '@workspace/api-client-react';

// ── Collection card ───────────────────────────────────────────────────────────

function CollectionCard({ collection, onPress }: { collection: Collection; onPress: () => void }) {
  const colors = useColors();
  const available = collection.availableCount ?? 0;
  const total = collection.productCount ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID={`collection-card-${collection.id}`}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
          <Ionicons name="leaf-outline" size={20} color={colors.accent} />
        </View>
        <View style={styles.cardText}>
          <Text
            style={[styles.cardName, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}
            numberOfLines={2}
          >
            {collection.name}
          </Text>
          {total > 0 && (
            <Text style={[styles.cardMeta, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
              {available > 0
                ? `${available} of ${total} available`
                : `${total} product${total !== 1 ? 's' : ''}`}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.cardRight}>
        {available > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.badgeText, { fontFamily: 'DMSans_500Medium' }]}>
              {available}
            </Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

// ── Search result product row ─────────────────────────────────────────────────

function SearchProductCard({ product }: { product: Product }) {
  const colors = useColors();
  const [imgError, setImgError] = useState(false);

  return (
    <View
      style={[styles.searchCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID={`search-product-card-${product.id}`}
    >
      {product.imageUrl && !imgError ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={[styles.searchThumb, { backgroundColor: colors.muted }]}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[styles.searchThumb, styles.searchThumbPlaceholder, { backgroundColor: colors.muted }]}>
          <Ionicons name="image-outline" size={18} color={colors.border} />
        </View>
      )}
      <View style={styles.searchCardBody}>
        <Text
          style={[styles.searchProductName, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}
          numberOfLines={2}
        >
          {product.name}
        </Text>
        <View style={styles.searchMeta}>
          {product.size ? (
            <Text style={[styles.metaChip, { color: colors.mutedForeground, borderColor: colors.border, fontFamily: 'DMSans_400Regular' }]}>
              {product.size}
            </Text>
          ) : null}
          <View style={[styles.availDot, { backgroundColor: product.available ? colors.accent : colors.muted }]} />
          <Text style={[styles.availLabel, { color: product.available ? colors.accent : colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
            {product.available ? 'Available' : 'Not available'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground, fontFamily: 'DMSans_500Medium' }]}>
      {title}
    </Text>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

type SearchListItem =
  | { kind: 'section'; id: string; title: string }
  | { kind: 'product'; id: string; product: Product };

export default function CatalogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;

  const {
    data: collections,
    isLoading: collectionsLoading,
    error: collectionsError,
    refetch: refetchCollections,
    isRefetching: isRefetchingCollections,
  } = useListCollections();

  const {
    data: allProducts,
    isLoading: productsLoading,
  } = useListProducts();

  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Build a map of collectionId → collection name for labelling search results
  const collectionMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of collections ?? []) {
      if (c.id != null) map.set(c.id, c.name);
    }
    return map;
  }, [collections]);

  // Filter + group products when searching
  const searchItems = useMemo<SearchListItem[]>(() => {
    if (!isSearching || !allProducts) return [];

    const lower = trimmed.toLowerCase();
    const matched = allProducts.filter(p =>
      p.name.toLowerCase().includes(lower)
    );

    // Group by first collectionId; products without a collection go under a catch-all
    const groups = new Map<number | null, Product[]>();
    for (const p of matched) {
      const key = p.collections?.[0]?.id ?? null;
      const arr = groups.get(key) ?? [];
      arr.push(p);
      groups.set(key, arr);
    }

    const items: SearchListItem[] = [];
    for (const [collId, products] of groups) {
      const title = collId != null ? (collectionMap.get(collId) ?? 'Collection') : 'Other';
      items.push({ kind: 'section', id: `section-${collId ?? 'none'}`, title });
      // available first
      const sorted = [
        ...products.filter(p => p.available),
        ...products.filter(p => !p.available),
      ];
      for (const p of sorted) {
        items.push({ kind: 'product', id: String(p.id), product: p });
      }
    }
    return items;
  }, [isSearching, allProducts, trimmed, collectionMap]);

  const isLoading = collectionsLoading;
  const error = collectionsError;
  const isEmpty = !isLoading && !error && (!collections || collections.length === 0);

  const searchBar = (
    <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={17} color={colors.mutedForeground} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, fontFamily: 'DMSans_400Regular' }]}
          placeholder="Search plants…"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {isSearching && Platform.OS !== 'ios' && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        {searchBar}
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        {searchBar}
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}>
            Failed to load catalog
          </Text>
          <Text style={[styles.errorSub, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
            Check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={() => refetchCollections()}
            style={[styles.retryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.retryText, { color: colors.accent, fontFamily: 'DMSans_500Medium' }]}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // ── Search results view ────────────────────────────────────────────────────
  if (isSearching) {
    const showSpinner = productsLoading && searchItems.length === 0;
    const noResults = !productsLoading && searchItems.length === 0;

    return (
      <>
        <Stack.Screen options={screenOptions} />
        {searchBar}
        {showSpinner ? (
          <View style={[styles.center, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : noResults ? (
          <View style={[styles.center, { backgroundColor: colors.background }]}>
            <Ionicons name="search-outline" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}>
              No plants found
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
              Try a different name or browse collections below.
            </Text>
          </View>
        ) : (
          <FlatList<SearchListItem>
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={[styles.list, { paddingBottom: botPad + 16 }]}
            data={searchItems}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              if (item.kind === 'section') {
                return <SectionHeader title={item.title} />;
              }
              return <SearchProductCard product={item.product} />;
            }}
            ListHeaderComponent={
              <Text style={[styles.listHeader, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                {searchItems.filter(i => i.kind === 'product').length} result
                {searchItems.filter(i => i.kind === 'product').length !== 1 ? 's' : ''} for "{trimmed}"
              </Text>
            }
          />
        )}
      </>
    );
  }

  // ── Normal collections view ────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={screenOptions} />
      <FlatList
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: botPad + 16 },
          isEmpty && styles.centerFlex,
        ]}
        data={collections ?? []}
        keyExtractor={c => String(c.id)}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <CollectionCard
            collection={item}
            onPress={() => router.push(`/catalog/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          <>
            {searchBar}
            {collections && collections.length > 0 ? (
              <Text style={[styles.listHeader, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                {collections.length} collection{collections.length !== 1 ? 's' : ''}
              </Text>
            ) : null}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingCollections}
            onRefresh={refetchCollections}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={52} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}>
              No Collections
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
              Our catalog is being prepared. Check back soon.
            </Text>
          </View>
        }
      />
    </>
  );
}

const screenOptions = {
  headerShown: true,
  title: 'Catalog',
  headerLeft: () => (
    <TouchableOpacity
      onPress={() => router.back()}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 12 }}
    >
      <Ionicons name="arrow-back" size={24} color="#ffffff" />
    </TouchableOpacity>
  ),
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerFlex: { flexGrow: 1, justifyContent: 'center' },
  list: { padding: 16, gap: 10 },
  listHeader: { fontSize: 13, marginBottom: 6 },

  // Search bar
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  // Collection card
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: { flex: 1 },
  cardName: { fontSize: 15, lineHeight: 21 },
  cardMeta: { fontSize: 12, marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    minWidth: 28,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: { color: '#ffffff', fontSize: 12 },

  // Search product card
  searchCard: {
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  searchThumb: {
    width: 72,
    height: 72,
    flexShrink: 0,
  },
  searchThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCardBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    gap: 6,
  },
  searchProductName: { fontSize: 14, lineHeight: 20 },
  searchMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaChip: {
    fontSize: 12,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availLabel: { fontSize: 12 },

  // Section header
  sectionHeader: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },

  // Error / empty
  errorTitle: { fontSize: 18 },
  errorSub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 4, paddingVertical: 9, paddingHorizontal: 22, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 15 },

  empty: { alignItems: 'center', gap: 10, paddingHorizontal: 28 },
  emptyTitle: { fontSize: 20 },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
