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

interface AgeGateProps {
  visible: boolean;
  minAge: number;
  onVerify: (code: string) => void;
  onClose: () => void;
}

export function AgeGate({ visible, minAge, onVerify, onClose }: AgeGateProps) {
  const colors = useColors();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const slideY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      slideY.value = withTiming(300, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

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
    if (fullCode.length === 6) {
      setLoading(true);
      setTimeout(() => {
        onVerify(fullCode);
        setLoading(false);
      }, 1000);
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
            Age Verification Required
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
            This ad is restricted to viewers aged {minAge} and above. Please
            enter the 6-digit verification code sent to your registered phone
            number.
          </Text>

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

          <View style={{ width: '100%', gap: spacing.sm }}>
            <Button
              title="Verify"
              onPress={handleVerify}
              loading={loading}
              disabled={!isComplete}
              style={{ width: '100%' }}
            />
            <Button
              title="Cancel"
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
