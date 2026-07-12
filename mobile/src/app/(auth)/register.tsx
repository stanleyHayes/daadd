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

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
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
      newErrors.name = 'Name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      setErrors({ email: 'Registration failed. Please try again.' });
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
                Create Account
              </Text>
              <Text
                style={[
                  typography.bodyLarge,
                  { color: colors.text.secondary, lineHeight: 24 },
                ]}
              >
                Join AdPlatform and start earning rewards by watching ads
              </Text>
            </View>
          </FadeIn>

          {/* Form */}
          <FadeIn delay={100}>
            <View style={{ marginBottom: spacing.xl }}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                icon="person-outline"
                autoCapitalize="words"
                error={errors.name}
              />

              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
              />

              <Input
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                icon="lock-closed-outline"
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={errors.password}
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
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
                By creating an account, you agree to our{' '}
                <Text
                  style={{ color: colors.primary, fontFamily: fontFamily.semibold }}
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  style={{ color: colors.primary, fontFamily: fontFamily.semibold }}
                >
                  Privacy Policy
                </Text>
                .
              </Text>

              <Button
                title="Create Account"
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
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.primary, fontFamily: fontFamily.bold },
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
