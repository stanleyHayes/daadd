import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegister } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const registerMutation = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) {
      newErrors.name = t('mobile.auth.errors.nameRequired');
    }
    if (!email.trim()) {
      newErrors.email = t('mobile.auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('mobile.auth.errors.emailInvalid');
    }
    if (!password) {
      newErrors.password = t('mobile.auth.errors.passwordRequired');
    } else if (password.length < 8) {
      newErrors.password = t('mobile.auth.errors.passwordMin8');
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = t('mobile.auth.errors.confirmRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('mobile.auth.errors.passwordsMismatch');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await registerMutation.mutateAsync({
        name,
        email,
        password,
        confirmPassword,
      });
      router.replace('/(tabs)');
    } catch {
      setErrors({ email: t('mobile.auth.errors.registrationFailed') });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceSecondary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>

          {/* Header */}
          <FadeIn delay={0}>
            <View style={{ marginBottom: spacing.xl }}>
              <Text
                style={[
                  typography.displaySmall,
                  { color: colors.text.primary, marginBottom: spacing.xs },
                ]}
              >
                {t('mobile.auth.createAccount')}
              </Text>
              <Text
                style={[
                  typography.bodyLarge,
                  { color: colors.text.secondary, lineHeight: 24 },
                ]}
              >
                {t('mobile.auth.createAccountSubtitle')}
              </Text>
            </View>
          </FadeIn>

          {/* Form */}
          <FadeIn delay={100}>
            <View style={{ marginBottom: spacing.xl }}>
              <Input
                label={t('mobile.auth.fullName')}
                placeholder={t('mobile.auth.fullNamePlaceholder')}
                value={name}
                onChangeText={setName}
                icon="person-outline"
                autoCapitalize="words"
                error={errors.name}
              />

              <Input
                label={t('mobile.auth.email')}
                placeholder={t('mobile.auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
              />

              <Input
                label={t('mobile.auth.password')}
                placeholder={t('mobile.auth.createPasswordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                icon="lock-closed-outline"
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={errors.password}
              />

              <Input
                label={t('mobile.auth.confirmPassword')}
                placeholder={t('mobile.auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon="lock-closed-outline"
                secureTextEntry={!showConfirm}
                rightIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowConfirm(!showConfirm)}
                error={errors.confirmPassword}
              />

              <Text
                style={[
                  typography.bodySmall,
                  {
                    color: colors.text.tertiary,
                    lineHeight: 18,
                    marginBottom: spacing.lg,
                  },
                ]}
              >
                {t('mobile.auth.termsPrefix')}{' '}
                <Text
                  style={{ color: colors.primary, fontFamily: fontFamily.semibold }}
                >
                  {t('mobile.auth.termsOfService')}
                </Text>{' '}
                {t('mobile.auth.termsAnd')}{' '}
                <Text
                  style={{ color: colors.primary, fontFamily: fontFamily.semibold }}
                >
                  {t('mobile.auth.privacyPolicy')}
                </Text>
                .
              </Text>

              <Button
                title={t('mobile.auth.createAccount')}
                onPress={handleRegister}
                loading={registerMutation.isPending}
                size="lg"
                style={{ width: '100%' }}
              />
            </View>
          </FadeIn>

          {/* Login Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: spacing.xl,
            }}
          >
            <Text
              style={[typography.bodyMedium, { color: colors.text.secondary }]}
            >
              {t('mobile.auth.alreadyHaveAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.primary, fontFamily: fontFamily.bold },
                ]}
              >
                {t('mobile.auth.signIn')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
