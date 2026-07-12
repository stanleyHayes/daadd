import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.xxl,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.surfaceSecondary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Ionicons name={icon} size={48} color={colors.text.tertiary} />
      </View>
      <Text
        style={[
          typography.headingMedium,
          { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm },
        ]}
      >
        {title}
      </Text>
      {message && (
        <Text
          style={[
            typography.bodyMedium,
            { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.lg },
          ]}
        >
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={{ marginTop: spacing.sm }}
        />
      )}
    </View>
  );
}
