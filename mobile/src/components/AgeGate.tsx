import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { Button } from './ui/Button';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface AgeGateProps {
  visible: boolean;
  minAge: number;
  onVerify: (code: string) => void;
  onClose: () => void;
  verifying?: boolean;
  errorMessage?: string | null;
}

export function AgeGate({ visible, minAge, onVerify, onClose, verifying = false, errorMessage }: AgeGateProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [devCode, setDevCode] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const slideY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 250 });
      setCode(Array(6).fill(''));
      // Request a verification code when the gate opens.
      // In dev the response includes `dev_code` so testers can proceed.
      api
        .post('/auth/age-verify/request')
        .then((res) => {
          setDevCode(res.data?.data?.dev_code ?? null);
        })
        .catch(() => {
          setDevCode(null);
        });
    } else {
      slideY.value = withTiming(300, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      setDevCode(null);
    }
  }, [visible]);

  // Clear inputs when the parent reports a verification error
  useEffect(() => {
    if (errorMessage) {
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    }
  }, [errorMessage]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: opacity.value,
  }));

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !verifying) {
      onVerify(fullCode);
    }
  };

  const isComplete = code.every((c) => c !== '');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.overlay,
          padding: spacing.lg,
        }}
      >
        <Animated.View
          style={[
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              width: '100%',
              maxWidth: 400,
              alignItems: 'center',
            },
            animatedModalStyle,
          ]}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.warning + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Ionicons name="warning" size={32} color={colors.warning} />
          </View>

          <Text
            style={[
              typography.headingLarge,
              {
                color: colors.text.primary,
                textAlign: 'center',
                marginBottom: spacing.sm,
              },
            ]}
          >
            {t('mobile.ageGate.title')}
          </Text>
          <Text
            style={[
              typography.bodyMedium,
              {
                color: colors.text.secondary,
                textAlign: 'center',
                marginBottom: spacing.lg,
                lineHeight: 22,
              },
            ]}
          >
            {t('mobile.ageGate.description', { minAge })}
          </Text>

          {devCode && (
            <Text
              style={[
                typography.bodySmall,
                {
                  color: colors.accent,
                  textAlign: 'center',
                  marginBottom: spacing.md,
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              {t('mobile.ageGate.devCode', { code: devCode })}
            </Text>
          )}

          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  {
                    width: 44,
                    height: 52,
                    borderRadius: borderRadius.md,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceSecondary,
                    textAlign: 'center',
                    fontSize: 20,
                    fontFamily: fontFamily.bold,
                    color: colors.text.primary,
                  },
                  digit
                    ? {
                        borderColor: colors.primary,
                        backgroundColor: colors.primary + '08',
                      }
                    : undefined,
                ]}
                value={digit}
                onChangeText={(value) => handleChange(value, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {errorMessage && (
            <Text
              style={[
                typography.bodySmall,
                {
                  color: colors.danger,
                  textAlign: 'center',
                  marginBottom: spacing.md,
                },
              ]}
            >
              {errorMessage}
            </Text>
          )}

          <View style={{ width: '100%', gap: spacing.sm }}>
            <Button
              title={t('mobile.ageGate.verify')}
              onPress={handleVerify}
              loading={verifying}
              disabled={!isComplete}
              style={{ width: '100%' }}
            />
            <Button
              title={t('mobile.common.cancel')}
              onPress={onClose}
              variant="outline"
              style={{ width: '100%' }}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
