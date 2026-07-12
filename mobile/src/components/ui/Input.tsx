import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontSize, fontFamily } from '@/theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: InputProps) {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <Text
          style={[
            typography.bodySmall,
            {
              fontFamily: fontFamily.semibold,
              color: colors.text.primary,
              marginBottom: spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceSecondary,
            borderRadius: borderRadius.md,
            borderWidth: 1.5,
            borderColor: 'transparent',
            paddingHorizontal: spacing.md,
          },
          isFocused && {
            borderColor: colors.primary,
            backgroundColor: colors.surface,
          },
          error ? { borderColor: colors.danger } : undefined,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.text.tertiary}
            style={{ marginRight: spacing.sm }}
          />
        )}
        <TextInput
          style={[
            {
              flex: 1,
              fontSize: fontSize.lg,
              fontFamily: fontFamily.regular,
              color: colors.text.primary,
              paddingVertical: spacing.sm + 4,
            },
            style,
          ]}
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={{ marginLeft: spacing.sm, padding: spacing.xs }}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text
          style={[
            typography.bodySmall,
            { color: colors.danger, marginTop: spacing.xs },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
