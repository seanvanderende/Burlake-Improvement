import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useListCollections, useListProducts } from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const colors = useColors();
  const [imgError, setImgError] = useState(false);

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID={`product-card-${product.id}`}
    >
      {/* Thumbnail */}
      {product.imageUrl && !imgError ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={[styles.thumb, { backgroundColor: colors.muted }]}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[styles.thumbPlaceholder, { backgroundColor: colors.muted }]}>
          <Ionicons name="image-outline" size={24} color={colors.border} />
        </View>
      )}

      <View style={styles.cardBody}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <Text
            style={[styles.productName, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          <View
            style={[
              styles.availBadge,
              { backgroundColor: product.available ? colors.accent : colors.muted },
            ]}
          >
            <Text
              style={[
                styles.availText,
                {
                  color: product.available ? '#ffffff' : colors.mutedForeground,
                  fontFamily: 'DMSans_500Medium',
                },
              ]}
            >
              {product.available ? 'Available' : 'Not Available'}
            </Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {product.sku && (
            <Text style={[styles.metaChip, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular', borderColor: colors.border }]}>
              SKU {product.sku}
            </Text>
          )}
          {product.size && (
            <Text style={[styles.metaChip, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular', borderColor: colors.border }]}>
              {product.size}
            </Text>
          )}
        </View>

        {/* Description */}
        {product.description ? (
          <Text
            style={[styles.description, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}
            numberOfLines={3}
          >
            {product.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CollectionProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const collectionId = id ? parseInt(id, 10) : undefined;

  const { data: collections } = useListCollections();
  const {
    data: products,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useListProducts(collectionId ? { collectionId } : undefined);

  const collection = collections?.find(c => c.id === collectionId);
  const collectionName = collection?.name ?? 'Products';

  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const available = products?.filter(p => p.available) ?? [];
  const unavailable = products?.filter(p => !p.available) ?? [];
  const sorted = [...available, ...unavailable];
  const isEmpty = !isLoading && !error && sorted.length === 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: collectionName,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}>
            Failed to load products
          </Text>
          <Text style={[styles.errorSub, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
            Check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.retryText, { color: colors.accent, fontFamily: 'DMSans_500Medium' }]}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: botPad + 16 },
            isEmpty && styles.centerFlex,
          ]}
          data={sorted}
          keyExtractor={p => String(p.id)}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListHeaderComponent={
            sorted.length > 0 ? (
              <View style={styles.listHeaderWrap}>
                <Text style={[styles.listHeader, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                  {sorted.length} product{sorted.length !== 1 ? 's' : ''}
                  {available.length > 0 && available.length < sorted.length
                    ? ` · ${available.length} available`
                    : available.length === sorted.length
                    ? ' · all available'
                    : ''}
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="leaf-outline" size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}>
                No Products Yet
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                Products for this collection will appear here.
              </Text>
            </View>
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerFlex: { flexGrow: 1, justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  listHeaderWrap: { marginBottom: 4 },
  listHeader: { fontSize: 13 },

  card: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: 180,
  },
  thumbPlaceholder: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 14, gap: 8 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  productName: { flex: 1, fontSize: 15, lineHeight: 21 },
  availBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  availText: { fontSize: 11 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: {
    fontSize: 12,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  description: { fontSize: 13, lineHeight: 19 },

  errorTitle: { fontSize: 18 },
  errorSub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 4, paddingVertical: 9, paddingHorizontal: 22, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 15 },

  empty: { alignItems: 'center', gap: 10, paddingHorizontal: 28 },
  emptyTitle: { fontSize: 20 },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
