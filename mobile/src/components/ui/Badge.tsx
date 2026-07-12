import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { RewardStatus } from '@/types';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  color,
  backgroundColor,
  size = 'md',
  style,
}: BadgeProps) {
  const colors = useColors();

  const variantColors = {
    default: { bg: colors.surfaceSecondary, text: colors.text.secondary },
    success: { bg: colors.accent + '20', text: colors.accent },
    warning: { bg: colors.warning + '20', text: colors.warningDark },
    danger: { bg: colors.danger + '20', text: colors.danger },
    info: { bg: colors.primary + '20', text: colors.primary },
  };

  const { bg, text: textColor } = variantColors[variant];

  return (
    <View
      style={[
        {
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.full,
          alignSelf: 'flex-start' as const,
          backgroundColor: backgroundColor || bg,
        },
        size === 'sm' && {
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
        },
        style,
      ]}
    >
      <Text
        style={[
          typography.caption,
          { fontFamily: 'EuclidA-Semibold', color: color || textColor },
          size === 'sm' && { fontSize: 9 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: RewardStatus }) {
  const statusConfig: Record<
    RewardStatus,
    { label: string; variant: BadgeProps['variant'] }
  > = {
    pending: { label: 'Pending', variant: 'warning' },
    credited: { label: 'Credited', variant: 'success' },
    redeemed: { label: 'Redeemed', variant: 'info' },
    expired: { label: 'Expired', variant: 'default' },
  };

  const config = statusConfig[status];
  return <Badge label={config.label} variant={config.variant} size="sm" />;
}
