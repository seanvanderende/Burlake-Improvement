import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { getGetProductQueryKey, useGetProduct } from '@workspace/api-client-react';

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = id ? parseInt(id, 10) : NaN;

  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useGetProduct(productId, {
    query: { enabled: !Number.isNaN(productId), queryKey: getGetProductQueryKey(productId) },
  });

  const [activePhoto, setActivePhoto] = useState(0);
  const [imgError, setImgError] = useState(false);

  const photos = product ? [product.imageUrl, ...product.photos].filter((p): p is string => !!p) : [];
  const heroUri = photos[activePhoto];

  const botPad = insets.bottom + 16;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: product?.name ?? 'Product',
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
      ) : error || !product ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}>
            Failed to load product
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
        <ScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ paddingBottom: botPad }}
        >
          {/* Hero image */}
          {heroUri && !imgError ? (
            <Image
              source={{ uri: heroUri }}
              style={[styles.hero, { backgroundColor: colors.muted }]}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder, { backgroundColor: colors.muted }]}>
              <Ionicons name="image-outline" size={40} color={colors.border} />
            </View>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbStrip}
              contentContainerStyle={styles.thumbStripContent}
            >
              {photos.map((uri, idx) => (
                <TouchableOpacity
                  key={`${uri}-${idx}`}
                  onPress={() => {
                    setActivePhoto(idx);
                    setImgError(false);
                  }}
                  style={[
                    styles.thumbWrap,
                    {
                      borderColor: idx === activePhoto ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.body}>
            {/* Header row */}
            <View style={styles.headerRow}>
              <Text style={[styles.name, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}>
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

            {/* Meta chips */}
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

            {/* Collections */}
            {product.collections.length > 0 && (
              <View style={styles.collectionsRow}>
                {product.collections.map(c => (
                  <Text
                    key={c.id}
                    style={[styles.collectionChip, { color: colors.accent, borderColor: colors.accent, fontFamily: 'DMSans_500Medium' }]}
                  >
                    {c.name}
                  </Text>
                ))}
              </View>
            )}

            {/* Description */}
            {product.description ? (
              <Text style={[styles.description, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                {product.description}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  hero: { width: '100%', height: 320 },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  thumbStrip: { marginTop: 10 },
  thumbStripContent: { paddingHorizontal: 16, gap: 8 },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },

  body: { padding: 16, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  name: { flex: 1, fontSize: 20, lineHeight: 27 },
  availBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  availText: { fontSize: 12 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: {
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  collectionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  collectionChip: {
    fontSize: 12,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  description: { fontSize: 14, lineHeight: 21, marginTop: 4 },

  errorTitle: { fontSize: 18 },
  errorSub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 4, paddingVertical: 9, paddingHorizontal: 22, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 15 },
});
