import React, { useState } from 'react';
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
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSubmitApplication } from '@workspace/api-client-react';

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  multiline,
  keyboardType,
  autoCapitalize,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  error?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground, fontFamily: 'DMSans_500Medium' }]}>
        {label}
        {required && <Text style={{ color: colors.destructive }}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMulti,
          {
            color: colors.foreground,
            fontFamily: 'DMSans_400Regular',
            borderColor: error ? colors.destructive : colors.border,
            backgroundColor: colors.background,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCorrect={false}
      />
      {!!error && (
        <Text style={[styles.fieldError, { color: colors.destructive, fontFamily: 'DMSans_400Regular' }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

type FormState = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  monthlyVolume: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function ApplyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mutateAsync: submitApplication, isPending } = useSubmitApplication();

  const [form, setForm] = useState<FormState>({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    monthlyVolume: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof FormState) => (value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.businessName.trim()) next.businessName = 'Business name is required.';
    if (!form.contactName.trim()) next.contactName = 'Contact name is required.';
    if (!form.email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    if (!form.businessType.trim()) next.businessType = 'Business type is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    try {
      await submitApplication({
        data: {
          businessName: form.businessName.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          businessType: form.businessType.trim(),
          monthlyVolume: form.monthlyVolume.trim() || null,
          notes: form.notes.trim() || null,
        },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ businessName: 'Something went wrong. Please try again.' });
    }
  };

  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (submitted) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Apply for Wholesale',
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
        <View style={[styles.successRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="checkmark-circle" size={52} color={colors.accent} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: 'DMSans_700Bold' }]}>
            Application Submitted
          </Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
            Thank you for applying! Our team will review your application and be in touch within 2–3 business days.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={[styles.doneBtn, { backgroundColor: colors.accent }]}
            activeOpacity={0.78}
          >
            <Text style={[styles.doneBtnText, { fontFamily: 'DMSans_600SemiBold' }]}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Apply for Wholesale',
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

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={[styles.introCard, { backgroundColor: colors.secondary }]}>
            <Ionicons name="business-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.introTitle, { color: '#ffffff', fontFamily: 'DMSans_600SemiBold' }]}>
                Wholesale Account Application
              </Text>
              <Text style={[styles.introBody, { color: 'rgba(255,255,255,0.75)', fontFamily: 'DMSans_400Regular' }]}>
                Fill out the form below and our team will be in touch to get you set up.
              </Text>
            </View>
          </View>

          {/* Form fields */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'DMSans_500Medium' }]}>
              BUSINESS INFORMATION
            </Text>

            <Field
              label="Business Name"
              value={form.businessName}
              onChangeText={set('businessName')}
              placeholder="e.g. Garden Centre Co."
              required
              error={errors.businessName}
            />
            <Field
              label="Business Type"
              value={form.businessType}
              onChangeText={set('businessType')}
              placeholder="e.g. Garden centre, florist, landscaper…"
              required
              error={errors.businessType}
            />
            <Field
              label="Estimated Monthly Volume"
              value={form.monthlyVolume}
              onChangeText={set('monthlyVolume')}
              placeholder="e.g. 500–1000 units"
              error={errors.monthlyVolume}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'DMSans_500Medium' }]}>
              CONTACT DETAILS
            </Text>

            <Field
              label="Contact Name"
              value={form.contactName}
              onChangeText={set('contactName')}
              placeholder="Your full name"
              required
              error={errors.contactName}
            />
            <Field
              label="Email"
              value={form.email}
              onChangeText={set('email')}
              placeholder="you@example.com"
              required
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChangeText={set('phone')}
              placeholder="604-555-0100"
              required
              keyboardType="phone-pad"
              autoCapitalize="none"
              error={errors.phone}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'DMSans_500Medium' }]}>
              ADDITIONAL NOTES
            </Text>

            <Field
              label="Notes (optional)"
              value={form.notes}
              onChangeText={set('notes')}
              placeholder="Any other information you'd like us to know…"
              multiline
              autoCapitalize="sentences"
              error={errors.notes}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isPending}
            style={[styles.submitBtn, { backgroundColor: colors.accent, opacity: isPending ? 0.6 : 1 }]}
            activeOpacity={0.78}
          >
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#ffffff" />
                <Text style={[styles.submitBtnText, { fontFamily: 'DMSans_600SemiBold' }]}>
                  Submit Application
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.mutedForeground, fontFamily: 'DMSans_400Regular' }]}>
            We typically respond within 2–3 business days. By submitting you agree to be contacted by our team.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 20 },

  introCard: {
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  introTitle: { fontSize: 15, marginBottom: 4 },
  introBody: { fontSize: 13, lineHeight: 19 },

  formSection: { gap: 14 },
  sectionLabel: { fontSize: 11, letterSpacing: 2 },

  field: { gap: 6 },
  label: { fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  inputMulti: {
    minHeight: 110,
    paddingTop: 14,
  },
  fieldError: { fontSize: 12 },

  submitBtn: {
    height: 54,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: { color: '#ffffff', fontSize: 16 },

  disclaimer: { fontSize: 12, lineHeight: 17, textAlign: 'center' },

  // Success state
  successRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 24, textAlign: 'center' },
  successBody: { fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  doneBtn: {
    marginTop: 8,
    height: 52,
    borderRadius: 8,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { color: '#ffffff', fontSize: 16 },
});
