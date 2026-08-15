import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useTranslation } from 'react-i18next';

interface ReferralInfo {
  code: string;
  share_url: string;
  activated_count: number;
  pending_count: number;
  bonus_tokens: number;
}

function useReferral() {
  return useQuery({
    queryKey: ['referral'],
    queryFn: async (): Promise<ReferralInfo> => {
      const res = await api.get('/referrals/me');
      const d = res.data?.data || {};
      return {
        code: d.code || '',
        share_url: d.share_url || '',
        activated_count: d.activated_count || 0,
        pending_count: d.pending_count || 0,
        bonus_tokens: d.bonus_tokens || 0,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export default function ReferralScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { data, isLoading } = useReferral();

  if (isLoading || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const share = async () => {
    try {
      await Share.share({
        message: t('mobile.referral.shareMessage', { code: data.code }),
        url: data.share_url,
      });
    } catch {
      /* dismissed — not an error */
    }
  };

  const stats = [
    { key: 'activated', value: data.activated_count, label: t('mobile.referral.activated'), color: colors.accent },
    { key: 'pending', value: data.pending_count, label: t('mobile.referral.pending'), color: colors.text.tertiary },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
    >
      <Card style={{ marginBottom: spacing.md, alignItems: 'center', paddingVertical: spacing.lg }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.accent + '22',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.sm,
          }}
        >
          <Ionicons name="gift" size={28} color={colors.accent} />
        </View>
        <Text style={[typography.headingMedium, { color: colors.text.primary, textAlign: 'center' }]}>
          {t('mobile.referral.heading')}
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs }]}>
          {t('mobile.referral.subtitle', { tokens: data.bonus_tokens })}
        </Text>
      </Card>

      {/* Code + share */}
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
          {t('mobile.referral.yourCode')}
        </Text>
        <TouchableOpacity
          onPress={share}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          }}
        >
          <Text style={[typography.displaySmall, { letterSpacing: 4, color: colors.text.primary }]}>{data.code}</Text>
          <Ionicons name="share-social-outline" size={22} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={share}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            borderRadius: borderRadius.md,
            paddingVertical: spacing.md,
            marginTop: spacing.md,
          }}
        >
          <Ionicons name="share-social-outline" size={18} color="#fff" />
          <Text style={[typography.button, { color: '#fff', marginLeft: spacing.xs }]}>
            {t('mobile.referral.share')}
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {stats.map((s) => (
          <Card key={s.key} style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.lg }}>
            <Text style={[typography.displaySmall, { color: s.color }]}>{s.value}</Text>
            <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>{s.label}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
