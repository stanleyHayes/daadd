import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const loginMutation = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await loginMutation.mutateAsync({ email, password });
      router.replace('/(tabs)');
    } catch {
      setErrors({ email: 'Invalid email or password' });
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
            justifyContent: 'center',
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <FadeIn delay={0}>
            <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  backgroundColor: colors.primary + '12',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: spacing.md,
                }}
              >
                <Ionicons name="megaphone" size={40} color={colors.primary} />
              </View>
              <Text
                style={[typography.displayLarge, { color: colors.primary }]}
              >
                AdPlatform
              </Text>
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: colors.text.secondary,
                    textAlign: 'center',
                    marginTop: spacing.xs,
                  },
                ]}
              >
                Watch ads. Earn rewards. It's that simple.
              </Text>
            </View>
          </FadeIn>

          {/* Form */}
          <FadeIn delay={150}>
            <View style={{ marginBottom: spacing.xl }}>
              <Text
                style={[
                  typography.headingLarge,
                  { color: colors.text.primary, marginBottom: spacing.xs },
                ]}
              >
                Welcome Back
              </Text>
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.text.secondary, marginBottom: spacing.lg },
                ]}
              >
                Sign in to your account to continue
              </Text>

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
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                icon="lock-closed-outline"
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={errors.password}
              />

              <TouchableOpacity
                style={{
                  alignSelf: 'flex-end',
                  marginBottom: spacing.lg,
                  marginTop: -spacing.sm,
                }}
                onPress={() => Alert.alert('Reset Password', 'A password reset link will be sent to your email address.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Send Link', onPress: () => Alert.alert('Sent!', 'Check your inbox for the reset link.') },
                ])}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.primary, fontFamily: fontFamily.semibold },
                  ]}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loginMutation.isPending}
                size="lg"
                style={{ width: '100%' }}
              />
            </View>
          </FadeIn>

          {/* Register Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={[typography.bodyMedium, { color: colors.text.secondary }]}
            >
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.primary, fontFamily: fontFamily.bold },
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
