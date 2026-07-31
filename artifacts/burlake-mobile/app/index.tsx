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

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Redirect once we know the user is already authenticated
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
        >
          {/* Brand mark */}
          <View style={styles.brand}>
            <View style={[styles.logoRing, { borderColor: colors.primary }]}>
              <Ionicons name="leaf-outline" size={38} color={colors.primary} />
            </View>
            <Text style={[styles.brandName, { color: '#ffffff', fontFamily: 'DMSans_700Bold' }]}>
              BURNABY LAKE{'\n'}GREENHOUSES
            </Text>
            <Text style={[styles.portalTag, { color: colors.primary, fontFamily: 'DMSans_500Medium' }]}>
              BUYER PORTAL
            </Text>
          </View>

          {/* Login card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'DMSans_700Bold' }]}>
                Welcome back
              </Text>
              <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
                Enter your portal password to access order forms and pricing.
              </Text>
            </View>

            <View style={[
              styles.inputWrap,
              {
                borderColor: error ? colors.destructive : colors.border,
                backgroundColor: colors.background,
              },
            ]}>
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
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 0,
  },
  brand: { alignItems: 'center', marginBottom: 44, gap: 0 },
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
  portalTag: { fontSize: 10, letterSpacing: 6, marginTop: 10 },

  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 10,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  cardHeader: { gap: 6 },
  cardTitle: { fontSize: 22 },
  cardBody: { fontSize: 14, lineHeight: 20 },

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

  errorMsg: { fontSize: 13, marginTop: -8 },

  loginBtn: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: { fontSize: 16 },

  footerTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 32 },
});
