import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useListCollections } from '@workspace/api-client-react';
import type { Collection } from '@workspace/api-client-react';

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

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CatalogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    data: collections,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useListCollections();

  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const isEmpty = !isLoading && !error && (!collections || collections.length === 0);

  return (
    <>
      <Stack.Screen
        options={{
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
            Failed to load catalog
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
          data={collections ?? []}
          keyExtractor={c => String(c.id)}
          renderItem={({ item }) => (
            <CollectionCard
              collection={item}
              onPress={() => router.push(`/catalog/${item.id}`)}
            />
          )}
          ListHeaderComponent={
            collections && collections.length > 0 ? (
              <Text style={[styles.listHeader, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                {collections.length} collection{collections.length !== 1 ? 's' : ''}
              </Text>
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
                No Collections
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                Our catalog is being prepared. Check back soon.
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
  list: { padding: 16, gap: 10 },
  listHeader: { fontSize: 13, marginBottom: 6 },

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

  errorTitle: { fontSize: 18 },
  errorSub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 4, paddingVertical: 9, paddingHorizontal: 22, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 15 },

  empty: { alignItems: 'center', gap: 10, paddingHorizontal: 28 },
  emptyTitle: { fontSize: 20 },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
