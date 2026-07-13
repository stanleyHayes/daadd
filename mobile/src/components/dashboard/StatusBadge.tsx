import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { CampaignStatus } from '@/types';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: CampaignStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const colorMap: Record<CampaignStatus, string> = {
    active: colors.accent,
    paused: colors.warning,
    completed: colors.primary,
    draft: colors.text.tertiary,
    archived: colors.text.tertiary,
  };
  const color = colorMap[status] ?? colors.text.tertiary;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: `${color}1A`,
        alignSelf: 'flex-start',
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
        }}
      />
      <Text
        style={[
          typography.caption,
          { color, textTransform: 'capitalize' },
        ]}
      >
        {t(`mobile.dashboard.status.${status}`, { defaultValue: status })}
      </Text>
    </View>
  );
}
