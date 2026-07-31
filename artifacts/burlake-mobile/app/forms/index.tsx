import React, { useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useListOrderForms } from '@workspace/api-client-react';
import type { OrderForm } from '@workspace/api-client-react';

// ── Logout button (in header) ────────────────────────────────────────────────

function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/');
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      hitSlop={{ top: 8, bottom: 8, left: 12, right: Platform.OS === 'web' ? 16 : 0 }}
    >
      <Ionicons name="log-out-outline" size={24} color="rgba(255,255,255,0.85)" />
    </TouchableOpacity>
  );
}

// ── Form card ────────────────────────────────────────────────────────────────

function FormCard({ form, onPress }: { form: OrderForm; onPress: () => void }) {
  const colors = useColors();

  const deadlineDate = form.deadline
    ? new Date(form.deadline + 'T00:00:00')
    : null;
  const now = new Date();
  const isPast = deadlineDate ? deadlineDate < now : false;
  const isUrgent =
    deadlineDate && !isPast
      ? deadlineDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000
      : false;

  const deadlineColor = isPast
    ? colors.destructive
    : isUrgent
    ? colors.primary
    : colors.mutedForeground;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID={`form-card-${form.id}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text
            style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}
            numberOfLines={2}
          >
            {form.title}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </View>

      <Text style={[styles.customerName, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
        {form.customerName}
      </Text>

      {form.season && form.season !== form.title && (
        <Text style={[styles.season, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
          {form.season}
        </Text>
      )}

      {deadlineDate && (
        <View style={styles.deadlineRow}>
          <Ionicons name="calendar-outline" size={13} color={deadlineColor} />
          <Text style={[styles.deadlineText, { color: deadlineColor, fontFamily: 'DMSans_500Medium' }]}>
            {isPast ? 'Closed · ' : 'Deadline: '}
            {deadlineDate.toLocaleDateString('en-CA', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      )}

      {form.description && (
        <Text
          style={[styles.description, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}
          numberOfLines={2}
        >
          {form.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function FormsListScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    data: forms,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useListOrderForms();

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading]);

  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const isEmpty = !isLoading && !error && (!forms || forms.length === 0);

  return (
    <>
      {/* Dynamic header options */}
      <Stack.Screen
        options={{
          title: 'Order Forms',
          headerRight: () => <LogoutButton />,
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
            Failed to load forms
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
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
          data={forms ?? []}
          keyExtractor={f => String(f.id)}
          scrollEnabled={!!forms && forms.length > 0}
          renderItem={({ item }) => (
            <FormCard
              form={item}
              onPress={() => router.push(`/forms/${item.id}`)}
            />
          )}
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
              <Ionicons name="document-text-outline" size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}>
                No Active Forms
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                Your order forms will appear here when they're ready.
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

  card: { borderRadius: 10, borderWidth: 1, padding: 16, gap: 6 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  cardTitle: { flex: 1, fontSize: 16, lineHeight: 22 },
  customerName: { fontSize: 14, paddingLeft: 18 },
  season: { fontSize: 13, paddingLeft: 18 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 18 },
  deadlineText: { fontSize: 13 },
  description: { fontSize: 13, paddingLeft: 18, lineHeight: 18 },

  errorTitle: { fontSize: 18 },
  errorSubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 4, paddingVertical: 9, paddingHorizontal: 22, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 15 },

  empty: { alignItems: 'center', gap: 10, paddingHorizontal: 28 },
  emptyTitle: { fontSize: 20 },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
