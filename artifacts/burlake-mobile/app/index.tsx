import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

// ── Quick-nav card ────────────────────────────────────────────────────────────

function NavCard({
  icon,
  title,
  subtitle,
  onPress,
  accent,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      style={[
        styles.navCard,
        {
          backgroundColor: accent ? colors.accent : colors.card,
          borderColor: accent ? colors.accent : colors.border,
        },
      ]}
    >
      <View style={[styles.navIconWrap, { backgroundColor: accent ? 'rgba(255,255,255,0.12)' : colors.muted }]}>
        <Ionicons
          name={icon as any}
          size={22}
          color={accent ? '#ffffff' : colors.accent}
        />
      </View>
      <View style={styles.navCardText}>
        <Text
          style={[
            styles.navCardTitle,
            { color: accent ? '#ffffff' : colors.foreground, fontFamily: 'DMSans_600SemiBold' },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.navCardSub,
            { color: accent ? 'rgba(255,255,255,0.75)' : colors.mutedForeground, fontFamily: 'DMSans_400Regular' },
          ]}
        >
          {subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={accent ? 'rgba(255,255,255,0.6)' : colors.mutedForeground}
      />
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Redirect portal users straight to forms once we confirm auth
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/forms');
    }
  }, [isAuthenticated, isLoading]);

  const handleLogin = async () => {
    const trimmed = password.trim();
    if (!trimmed) return;
    setError('');
    setIsSubmitting(true);
    try {
      await login(trimmed);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/forms');
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Incorrect password. Please try again.');
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const canSubmit = password.trim().length > 0 && !isSubmitting;

  if (isLoading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: colors.secondary }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.secondary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 32, paddingBottom: botPad + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand mark ── */}
          <View style={styles.brand}>
            <View style={[styles.logoRing, { borderColor: colors.primary }]}>
              <Ionicons name="leaf-outline" size={38} color={colors.primary} />
            </View>
            <Text style={[styles.brandName, { color: '#ffffff', fontFamily: 'DMSans_700Bold' }]}>
              BURNABY LAKE{'\n'}GREENHOUSES
            </Text>
            <Text style={[styles.brandTagline, { color: colors.primary, fontFamily: 'DMSans_400Regular' }]}>
              Wholesale Growers Since 1987
            </Text>
          </View>

          {/* ── Public nav cards ── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'DMSans_500Medium' }]}>
              EXPLORE
            </Text>
            <NavCard
              icon="grid-outline"
              title="Browse Catalog"
              subtitle="Browse our full range of plants and collections"
              onPress={() => router.push('/catalog')}
              accent
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <NavCard
              icon="business-outline"
              title="Apply for Wholesale"
              subtitle="Open a wholesale account with us"
              onPress={() => router.push('/apply')}
            />
          </View>

          {/* ── Portal login ── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'DMSans_500Medium' }]}>
              BUYER PORTAL
            </Text>
            <Text style={[styles.portalBody, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
              Enter your portal password to access order forms and pricing.
            </Text>

            <View
              style={[
                styles.inputWrap,
                {
                  borderColor: error ? colors.destructive : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.foreground, fontFamily: 'DMSans_400Regular' }]}
                placeholder="Portal password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                testID="password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            {!!error && (
              <Text style={[styles.errorMsg, { color: colors.destructive, fontFamily: 'DMSans_400Regular' }]}>
                {error}
              </Text>
            )}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={!canSubmit}
              style={[
                styles.loginBtn,
                { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.45 },
              ]}
              activeOpacity={0.78}
              testID="login-button"
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.loginBtnText, { color: colors.primaryForeground, fontFamily: 'DMSans_700Bold' }]}>
                  Enter Portal
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.footerTxt, { fontFamily: 'DMSans_400Regular' }]}>
            burlake.com
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },

  brand: { alignItems: 'center', marginBottom: 8, gap: 0 },
  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  brandName: {
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    lineHeight: 26,
  },
  brandTagline: { fontSize: 13, marginTop: 10, letterSpacing: 0.5 },

  section: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 10,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  sectionLabel: { fontSize: 11, letterSpacing: 2 },
  divider: { height: 1, marginVertical: -4 },

  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  navIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCardText: { flex: 1 },
  navCardTitle: { fontSize: 15 },
  navCardSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },

  portalBody: { fontSize: 13, lineHeight: 19 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, fontSize: 16 },
  eyeBtn: { paddingLeft: 8 },
  errorMsg: { fontSize: 13, marginTop: -6 },
  loginBtn: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  loginBtnText: { fontSize: 16 },

  footerTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 },
});
