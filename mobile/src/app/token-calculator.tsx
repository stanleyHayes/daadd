import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';

interface TokenInfo {
  token_value: number;
  tokens_per_dollar: number;
  average: { per_view: number; per_click: number; per_review: number; per_photo: number };
  balance: number;
  balance_tokens: number;
}

function useTokenInfo() {
  return useQuery({
    queryKey: ['tokenInfo'],
    queryFn: async (): Promise<TokenInfo> => {
      const res = await api.get('/rewards/token-info');
      return res.data.data;
    },
  });
}

export default function TokenCalculatorScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: info, isLoading } = useTokenInfo();

  const [views, setViews] = useState('10');
  const [clicks, setClicks] = useState('5');
  const [reviews, setReviews] = useState('2');
  const [photos, setPhotos] = useState('1');

  if (isLoading || !info) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const n = (v: string) => {
    const parsed = parseInt(v, 10);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const rows = [
    { key: 'views', label: t('mobile.tokenCalc.perView'), value: views, set: setViews, rate: info.average.per_view },
    { key: 'clicks', label: t('mobile.tokenCalc.perClick'), value: clicks, set: setClicks, rate: info.average.per_click },
    { key: 'reviews', label: t('mobile.tokenCalc.perReview'), value: reviews, set: setReviews, rate: info.average.per_review },
    { key: 'photos', label: t('mobile.tokenCalc.perPhoto'), value: photos, set: setPhotos, rate: info.average.per_photo },
  ];

  const estimatedTokens = rows.reduce((sum, r) => sum + n(r.value) * r.rate, 0);
  const estimatedValue = estimatedTokens * info.token_value;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Token value */}
      <Card style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
          <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
          <Text style={[typography.bodyMedium, { color: colors.text.secondary }]}>
            {t('mobile.tokenCalc.tokenValue')}
          </Text>
        </View>
        <Text style={[typography.displaySmall, { color: colors.text.primary }]}>
          ${info.token_value.toFixed(2)} = 1 {t('mobile.tokenCalc.token')}
        </Text>
        <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 2 }]}>
          $1.00 = {info.tokens_per_dollar} {t('mobile.tokenCalc.tokens')}
        </Text>
      </Card>

      {/* Your balance */}
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[typography.bodyMedium, { color: colors.text.secondary }]}>
          {t('mobile.tokenCalc.yourTokens')}
        </Text>
        <Text style={[typography.displaySmall, { color: colors.accent }]}>
          {info.balance_tokens} {t('mobile.tokenCalc.tokens')}
        </Text>
        <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
          ≈ ${info.balance.toFixed(2)}
        </Text>
      </Card>

      {/* Estimator */}
      <Text style={[typography.headingSmall, { color: colors.text.primary, marginBottom: spacing.sm }]}>
        {t('mobile.tokenCalc.estimateTitle')}
      </Text>
      <Card>
        {rows.map((r) => (
          <View
            key={r.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, { color: colors.text.primary }]}>{r.label}</Text>
              <Text style={[typography.caption, { color: colors.text.tertiary }]}>
                {r.rate} {t('mobile.tokenCalc.tokensEach')}
              </Text>
            </View>
            <TextInput
              value={r.value}
              onChangeText={(x) => r.set(x.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={[
                typography.bodyMedium,
                {
                  width: 64,
                  textAlign: 'center',
                  color: colors.text.primary,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            />
            <Text
              style={[
                typography.bodyMedium,
                { width: 72, textAlign: 'right', color: colors.text.secondary },
              ]}
            >
              {n(r.value) * r.rate}
            </Text>
          </View>
        ))}

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md }}>
          <Text style={[typography.bodyMedium, { flex: 1, color: colors.text.primary, fontFamily: fontFamily.semibold }]}>
            {t('mobile.tokenCalc.estimatedTotal')}
          </Text>
          <Text style={[typography.headingSmall, { color: colors.accent }]}>
            {estimatedTokens} · ${estimatedValue.toFixed(2)}
          </Text>
        </View>
      </Card>

      <Text
        style={[
          typography.caption,
          { color: colors.text.tertiary, marginTop: spacing.md, textAlign: 'center' },
        ]}
      >
        {t('mobile.tokenCalc.disclaimer')}
      </Text>
    </ScrollView>
  );
}
