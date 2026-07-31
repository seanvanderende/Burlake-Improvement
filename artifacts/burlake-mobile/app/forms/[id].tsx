import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useGetOrderForm, ApiError } from '@workspace/api-client-react';
import type { OrderFormItem } from '@workspace/api-client-react';
import { Image } from 'expo-image';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseUnitsPerCase(pack: string | null | undefined): number {
  if (!pack) return 1;
  const m = pack.match(/\d+/);
  return m ? parseInt(m[0], 10) : 1;
}

function money(n: number): string {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function makeOrderId(): string {
  return 'ORD-' + Date.now().toString(36).toUpperCase().slice(-6);
}

// ── Stepper ───────────────────────────────────────────────────────────────────

interface StepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  accentColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
}

function Stepper({ value, onIncrement, onDecrement, accentColor, borderColor, textColor, mutedColor }: StepperProps) {
  return (
    <View style={[stepperS.row, { borderColor }]}>
      <TouchableOpacity
        onPress={onDecrement}
        disabled={value === 0}
        style={[stepperS.btn, { opacity: value === 0 ? 0.28 : 1 }]}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Ionicons name="remove" size={16} color={textColor} />
      </TouchableOpacity>
      <Text style={[
        stepperS.value,
        {
          color: value > 0 ? accentColor : mutedColor,
          fontFamily: 'DMSans_600SemiBold',
        },
      ]}>
        {value}
      </Text>
      <TouchableOpacity
        onPress={onIncrement}
        style={stepperS.btn}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Ionicons name="add" size={16} color={textColor} />
      </TouchableOpacity>
    </View>
  );
}

const stepperS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  value: { width: 30, textAlign: 'center', fontSize: 15 },
});

// ── Item row ──────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: OrderFormItem;
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onPhotoPress?: (url: string, name: string) => void;
  colors: ReturnType<typeof useColors>;
}

function ItemRow({ item, qty, onIncrement, onDecrement, onPhotoPress, colors }: ItemRowProps) {
  const price = item.casePrice ? parseFloat(item.casePrice) : null;
  const lineTotal = price && qty > 0 ? price * qty : null;
  const hasPhoto = !!item.photoUrl;

  return (
    <View style={[
      itemS.row,
      {
        borderBottomColor: colors.border,
        backgroundColor: qty > 0 ? 'rgba(45,76,53,0.05)' : 'transparent',
      },
    ]}>
      {hasPhoto && (
        <TouchableOpacity
          onPress={() => onPhotoPress?.(item.photoUrl!, item.name)}
          style={[itemS.thumbWrap, { borderColor: colors.border }]}
          activeOpacity={0.75}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Image
            source={item.photoUrl!}
            style={itemS.thumb}
            contentFit="cover"
            transition={200}
          />
        </TouchableOpacity>
      )}
      <View style={itemS.info}>
        <Text
          style={[itemS.name, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <View style={itemS.meta}>
          {!!item.itemNum && (
            <Text style={[itemS.metaText, { color: colors.mutedForeground }]}>#{item.itemNum}</Text>
          )}
          {!!item.pack && (
            <Text style={[itemS.metaText, { color: colors.mutedForeground }]}>{item.pack}</Text>
          )}
          {price != null && (
            <Text style={[itemS.metaText, { color: colors.mutedForeground }]}>{money(price)}/cs</Text>
          )}
        </View>
        {lineTotal != null && (
          <Text style={[itemS.lineTotal, { color: colors.accent, fontFamily: 'DMSans_600SemiBold' }]}>
            {money(lineTotal)}
          </Text>
        )}
      </View>
      <Stepper
        value={qty}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        accentColor={colors.secondary}
        borderColor={colors.border}
        textColor={colors.foreground}
        mutedColor={colors.mutedForeground}
      />
    </View>
  );
}

const itemS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  thumbWrap: { width: 56, height: 56, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, marginRight: 10, flexShrink: 0, overflow: 'hidden' },
  thumb: { width: 56, height: 56 },
  info: { flex: 1, marginRight: 12, gap: 3 },
  name: { fontSize: 15, lineHeight: 20 },
  meta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaText: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  lineTotal: { fontSize: 13 },
});

// ── List header ───────────────────────────────────────────────────────────────

interface ListHeaderProps {
  season: string | null | undefined;
  description: string | null | undefined;
  deadline: string | null | undefined;
  search: string;
  onSearchChange: (t: string) => void;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  colors: ReturnType<typeof useColors>;
}

function ListHeader({
  season,
  description,
  deadline,
  search,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
  colors,
}: ListHeaderProps) {
  const deadlineDate = deadline ? new Date(deadline + 'T00:00:00') : null;
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
    : colors.primary;

  const showBanner = (season && season.length > 0) || description || deadlineDate;

  return (
    <View>
      {/* Form info banner */}
      {showBanner && (
        <View style={[lhS.banner, { backgroundColor: colors.secondary }]}>
          {!!season && (
            <Text style={[lhS.season, { fontFamily: 'DMSans_500Medium' }]}>
              {season}
            </Text>
          )}
          {!!description && (
            <Text style={[lhS.description, { fontFamily: 'DMSans_400Regular' }]}>
              {description}
            </Text>
          )}
          {deadlineDate && (
            <View style={lhS.deadlineRow}>
              <Ionicons name="calendar-outline" size={13} color={deadlineColor} />
              <Text style={[lhS.deadline, { color: deadlineColor, fontFamily: 'DMSans_500Medium' }]}>
                {isPast ? 'Closed · ' : 'Order Deadline: '}
                {deadlineDate.toLocaleDateString('en-CA', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Search */}
      <View style={[lhS.searchWrap, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[lhS.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[lhS.searchInput, { color: colors.foreground, fontFamily: 'DMSans_400Regular' }]}
            placeholder="Search items…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={onSearchChange}
          />
          {!!search && (
            <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
      {categories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[lhS.chips]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={[lhS.chipsScroll, { borderBottomColor: colors.border }]}
        >
          <TouchableOpacity
            onPress={() => onCategoryChange(null)}
            style={[
              lhS.chip,
              {
                backgroundColor: !activeCategory ? colors.accent : colors.muted,
                borderColor: !activeCategory ? colors.accent : colors.border,
              },
            ]}
          >
            <Text style={[lhS.chipText, {
              color: !activeCategory ? '#ffffff' : colors.mutedForeground,
              fontFamily: 'DMSans_500Medium',
            }]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => onCategoryChange(cat === activeCategory ? null : cat)}
              style={[
                lhS.chip,
                {
                  backgroundColor: activeCategory === cat ? colors.accent : colors.muted,
                  borderColor: activeCategory === cat ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[lhS.chipText, {
                color: activeCategory === cat ? '#ffffff' : colors.mutedForeground,
                fontFamily: 'DMSans_500Medium',
              }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const lhS = StyleSheet.create({
  banner: { padding: 16, gap: 6 },
  season: { fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 },
  description: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deadline: { fontSize: 13 },
  searchWrap: { padding: 12, borderBottomWidth: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, height: 24 },
  chipsScroll: { borderBottomWidth: 1 },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
});

// ── Screen ────────────────────────────────────────────────────────────────────

type Qty = Record<number, number>;

export default function FormDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const formId = parseInt(id ?? '0', 10);

  const { data: form, isLoading, error, refetch } = useGetOrderForm(formId);

  const [qty, setQty] = useState<Qty>({});
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Photo viewer state
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; name: string } | null>(null);

  // Email modal state
  const [showModal, setShowModal] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [storeError, setStoreError] = useState(false);
  const [buyerError, setBuyerError] = useState(false);

  const orderId = useRef(makeOrderId());

  // Stable increment / decrement handlers
  const increment = useCallback((itemId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQty(q => ({ ...q, [itemId]: (q[itemId] ?? 0) + 1 }));
  }, []);

  const decrement = useCallback((itemId: number) => {
    setQty(q => {
      const cur = q[itemId] ?? 0;
      if (cur === 0) return q;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return { ...q, [itemId]: cur - 1 };
    });
  }, []);

  const categories = useMemo(() => {
    if (!form?.items) return [];
    const set = new Set<string>();
    form.items.forEach(it => { if (it.category) set.add(it.category); });
    return Array.from(set).sort();
  }, [form]);

  const filteredItems = useMemo(() => {
    if (!form?.items) return [];
    const q = search.toLowerCase();
    return form.items.filter(it => {
      const matchesCat = !activeCategory || it.category === activeCategory;
      const matchesSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        (it.itemNum ?? '').toLowerCase().includes(q) ||
        (it.upc ?? '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [form, search, activeCategory]);

  const totals = useMemo(() => {
    if (!form?.items) return { items: 0, cases: 0, units: 0, total: 0 };
    let items = 0, cases = 0, units = 0, total = 0;
    form.items.forEach(it => {
      const q = qty[it.id] ?? 0;
      if (q > 0) {
        items++;
        cases += q;
        units += q * parseUnitsPerCase(it.pack);
        if (it.casePrice) total += q * parseFloat(it.casePrice);
      }
    });
    return { items, cases, units, total };
  }, [form, qty]);

  const hasSelection = totals.cases > 0;

  // ── Email modal handlers ────────────────────────────────────────────────────

  const openModal = () => {
    if (!hasSelection) return;
    Keyboard.dismiss();
    setShowModal(true);
  };

  const sendEmail = async () => {
    let hasErr = false;
    if (!storeName.trim()) { setStoreError(true); hasErr = true; }
    if (!buyerName.trim()) { setBuyerError(true); hasErr = true; }
    if (hasErr) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!form) return;

    const selected = (form.items ?? []).filter(it => (qty[it.id] ?? 0) > 0);

    const lines: string[] = [
      `Order: ${form.title}`,
      `ID: ${orderId.current}`,
      '',
      `Store: ${storeName.trim()}`,
      `Buyer: ${buyerName.trim()}`,
    ];
    if (poNumber.trim()) lines.push(`PO #: ${poNumber.trim()}`);
    lines.push('', 'SELECTIONS', '─'.repeat(36));

    selected.forEach(it => {
      const q = qty[it.id] ?? 0;
      const price = it.casePrice ? parseFloat(it.casePrice) : null;
      const lineStr = price ? ` — ${money(price * q)}` : '';
      lines.push(
        `${it.name}  ×${q}${it.pack ? ` (${it.pack})` : ''}${lineStr}`
      );
    });

    lines.push('─'.repeat(36));
    lines.push(`Total: ${totals.cases} case${totals.cases !== 1 ? 's' : ''}, ${totals.units} unit${totals.units !== 1 ? 's' : ''}`);
    if (totals.total > 0) {
      lines.push(`Est. Total: ${money(totals.total)}`);
    }

    const subject = `Order ${orderId.current} — ${form.title} · ${storeName.trim()}`;
    const body = lines.join('\n');
    const to = form.replyToEmail ?? '';

    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL('mailto:');
      if (!supported && Platform.OS !== 'web') {
        Alert.alert('No email app', 'Install an email app to send orders.');
        return;
      }
      await Linking.openURL(mailto);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
    } catch {
      Alert.alert('Error', 'Could not open your email app. Please try again.');
    }
  };

  // ── Layout constants ────────────────────────────────────────────────────────

  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const footerH = 74 + botPad;

  // ── Render states ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading…' }} />
        <View style={[s.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </>
    );
  }

  if (error || !form) {
    // 403 means the form is closed or deadline has passed — not a transient error
    const isClosed = error != null && error instanceof ApiError && error.status === 403;
    const closedMsg =
      error != null && error instanceof ApiError && typeof error.data === 'object' && error.data !== null
        ? (error.data as { error?: string }).error ?? 'This form is no longer accepting orders'
        : 'This form is no longer accepting orders';

    return (
      <>
        <Stack.Screen options={{ title: isClosed ? 'Form Closed' : 'Error' }} />
        <View style={[s.center, { backgroundColor: colors.background }]}>
          {isClosed ? (
            <>
              <View style={[s.closedIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name="lock-closed" size={32} color={colors.mutedForeground} />
              </View>
              <Text style={[s.errorTitle, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}>
                Form Closed
              </Text>
              <Text style={[s.closedMsg, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                {closedMsg}
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[s.retryBtn, { borderColor: colors.border }]}
              >
                <Text style={[s.retryText, { color: colors.accent, fontFamily: 'DMSans_500Medium' }]}>
                  Back to forms
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={44} color={colors.destructive} />
              <Text style={[s.errorTitle, { color: colors.foreground, fontFamily: 'DMSans_600SemiBold' }]}>
                Could not load form
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                style={[s.retryBtn, { borderColor: colors.border }]}
              >
                <Text style={[s.retryText, { color: colors.accent, fontFamily: 'DMSans_500Medium' }]}>
                  Try again
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: form.title }} />

      {/* Product list */}
      <FlatList
        data={filteredItems}
        keyExtractor={it => String(it.id)}
        ListHeaderComponent={
          <ListHeader
            season={form.season}
            description={form.description}
            deadline={form.deadline}
            search={search}
            onSearchChange={setSearch}
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            colors={colors}
          />
        }
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            qty={qty[item.id] ?? 0}
            onIncrement={() => increment(item.id)}
            onDecrement={() => decrement(item.id)}
            onPhotoPress={(url, name) => setSelectedPhoto({ url, name })}
            colors={colors}
          />
        )}
        contentContainerStyle={{ paddingBottom: footerH + 8 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View style={s.emptyItems}>
            <Ionicons name="search-outline" size={36} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
              No items match your search.
            </Text>
          </View>
        }
      />

      {/* Sticky footer — totals + email button */}
      <View style={[s.footer, { backgroundColor: colors.secondary, paddingBottom: botPad + 12 }]}>
        <View style={s.footerLeft}>
          {hasSelection ? (
            <>
              <Text style={[s.footerCases, { color: '#ffffff', fontFamily: 'DMSans_700Bold' }]}>
                {totals.cases} case{totals.cases !== 1 ? 's' : ''}
              </Text>
              <Text style={[s.footerMeta, { color: 'rgba(255,255,255,0.55)', fontFamily: 'DMSans_400Regular' }]}>
                {totals.items} item{totals.items !== 1 ? 's' : ''} · {totals.units} unit{totals.units !== 1 ? 's' : ''}
                {totals.total > 0 ? `  ·  ${money(totals.total)}` : ''}
              </Text>
            </>
          ) : (
            <Text style={[s.footerHint, { color: 'rgba(255,255,255,0.38)', fontFamily: 'DMSans_400Regular' }]}>
              Tap + to add items to your order
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={openModal}
          disabled={!hasSelection}
          style={[
            s.emailBtn,
            {
              backgroundColor: colors.primary,
              opacity: hasSelection ? 1 : 0.3,
            },
          ]}
          activeOpacity={0.8}
          testID="email-order-button"
        >
          <Ionicons name="mail" size={18} color={colors.primaryForeground} />
          <Text style={[s.emailBtnText, { color: colors.primaryForeground, fontFamily: 'DMSans_700Bold' }]}>
            Email
          </Text>
        </TouchableOpacity>
      </View>

      {/* Email-details modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => { Keyboard.dismiss(); setShowModal(false); }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[s.sheet, { backgroundColor: colors.card, paddingBottom: Math.max(botPad, 16) + 16 }]}
              onPress={() => {}} // swallow press so overlay dismiss doesn't fire
            >
              {/* Drag handle */}
              <View style={[s.handle, { backgroundColor: colors.muted }]} />

              {/* Header */}
              <View style={s.sheetHeader}>
                <Text style={[s.sheetTitle, { color: colors.foreground, fontFamily: 'DMSans_700Bold' }]}>
                  Send Order
                </Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={22} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <Text style={[s.sheetSub, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                {totals.cases} case{totals.cases !== 1 ? 's' : ''} across {totals.items} item{totals.items !== 1 ? 's' : ''}
                {totals.total > 0 ? `  ·  ${money(totals.total)}` : ''}
              </Text>

              {/* Fields */}
              <View style={s.fields}>
                {/* Store */}
                <View>
                  <Text style={[s.label, { color: storeError ? colors.destructive : colors.mutedForeground, fontFamily: 'DMSans_500Medium' }]}>
                    Store / Location *
                  </Text>
                  <TextInput
                    style={[s.fieldInput, {
                      borderColor: storeError ? colors.destructive : colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.background,
                      fontFamily: 'DMSans_400Regular',
                    }]}
                    placeholder="e.g. Sobeys #1234 — Burnaby"
                    placeholderTextColor={colors.mutedForeground}
                    value={storeName}
                    onChangeText={t => { setStoreName(t); setStoreError(false); }}
                    returnKeyType="next"
                    autoCorrect={false}
                  />
                </View>

                {/* Buyer */}
                <View>
                  <Text style={[s.label, { color: buyerError ? colors.destructive : colors.mutedForeground, fontFamily: 'DMSans_500Medium' }]}>
                    Buyer Name *
                  </Text>
                  <TextInput
                    style={[s.fieldInput, {
                      borderColor: buyerError ? colors.destructive : colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.background,
                      fontFamily: 'DMSans_400Regular',
                    }]}
                    placeholder="Your full name"
                    placeholderTextColor={colors.mutedForeground}
                    value={buyerName}
                    onChangeText={t => { setBuyerName(t); setBuyerError(false); }}
                    returnKeyType="next"
                    autoCorrect={false}
                  />
                </View>

                {/* PO */}
                <View>
                  <Text style={[s.label, { color: colors.mutedForeground, fontFamily: 'DMSans_500Medium' }]}>
                    PO # (optional)
                  </Text>
                  <TextInput
                    style={[s.fieldInput, {
                      borderColor: colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.background,
                      fontFamily: 'DMSans_400Regular',
                    }]}
                    placeholder="Purchase order number"
                    placeholderTextColor={colors.mutedForeground}
                    value={poNumber}
                    onChangeText={setPoNumber}
                    returnKeyType="done"
                    onSubmitEditing={sendEmail}
                  />
                </View>
              </View>

              {/* No reply-to warning */}
              {!form.replyToEmail && (
                <View style={[s.warning, { backgroundColor: colors.muted }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
                  <Text style={[s.warningText, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                    No recipient is configured for this form. Your email app will open with a blank "To" field — add the address before sending.
                  </Text>
                </View>
              )}

              {/* Send button */}
              <TouchableOpacity
                onPress={sendEmail}
                style={[s.sendBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.82}
              >
                <Ionicons name="mail-outline" size={18} color="#ffffff" />
                <Text style={[s.sendBtnText, { fontFamily: 'DMSans_700Bold' }]}>
                  Open Email App
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Photo full-screen viewer */}
      <PhotoViewer photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </View>
  );
}

// ── Photo viewer modal ────────────────────────────────────────────────────────

function PhotoViewer({
  photo,
  onClose,
}: {
  photo: { url: string; name: string } | null;
  onClose: () => void;
}) {
  if (!photo) return null;
  return (
    <Modal
      visible
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={pvS.overlay}>
        {/* Tap outside to close */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Image
          source={photo.url}
          style={pvS.image}
          contentFit="contain"
          transition={200}
        />
        <View style={pvS.caption}>
          <Text style={pvS.captionText} numberOfLines={2}>{photo.name}</Text>
        </View>
        <TouchableOpacity
          style={pvS.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const pvS = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '72%',
  },
  caption: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  captionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  errorTitle: { fontSize: 18 },
  closedIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  closedMsg: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: -4 },
  retryBtn: { marginTop: 4, paddingVertical: 9, paddingHorizontal: 22, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 15 },
  emptyItems: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 15 },

  // Sticky footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  footerLeft: { flex: 1, gap: 2 },
  footerCases: { fontSize: 20 },
  footerMeta: { fontSize: 12 },
  footerHint: { fontSize: 13 },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    height: 46,
    borderRadius: 8,
  },
  emailBtnText: { fontSize: 15 },

  // Modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 20 },
  sheetSub: { fontSize: 14, marginTop: -8 },
  fields: { gap: 14 },
  label: { fontSize: 13, marginBottom: 6 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
  },
  warning: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 8, alignItems: 'flex-start' },
  warningText: { flex: 1, fontSize: 13, lineHeight: 18 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 10,
  },
  sendBtnText: { color: '#ffffff', fontSize: 16 },
});
