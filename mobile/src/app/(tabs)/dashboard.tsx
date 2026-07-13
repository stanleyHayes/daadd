import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDashboardKpis, useCampaigns } from '@/hooks/useDashboard';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Skeleton } from '@/components/dashboard/Skeleton';
import { formatNumber, formatCurrency } from '@/lib/format';
import { DashboardCampaign } from '@/types';

function KpiCard({
  icon,
  label,
  value,
  change,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  change?: number;
}) {
  const colors = useColors();
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card style={{ width: '48%', marginBottom: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          marginBottom: spacing.sm,
        }}
      >
        <Ionicons name={icon} size={16} color={colors.text.tertiary} />
        <Text
          style={[typography.caption, { color: colors.text.tertiary, flex: 1 }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <Text style={[typography.headingMedium, { color: colors.text.primary }]}>
        {value}
      </Text>
      {change !== undefined && (
        <Text
          style={[
            typography.caption,
            {
              color: isPositive ? colors.accent : colors.danger,
              marginTop: spacing.xs,
            },
          ]}
        >
          {isPositive ? '▲' : '▼'} {Math.abs(change)}%
        </Text>
      )}
    </Card>
  );
}

function CampaignRow({ campaign }: { campaign: DashboardCampaign }) {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();

  const budgetTotal = campaign.budget_total ?? 0;
  const budgetSpent = campaign.budget_spent ?? 0;
  const progress = budgetTotal > 0 ? Math.min(1, budgetSpent / budgetTotal) : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/dashboard/campaign/${campaign.id}` as Href)}
    >
      <Card style={{ marginBottom: spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.sm,
          }}
        >
          <Text
            style={[
              typography.headingSmall,
              { color: colors.text.primary, flex: 1, marginRight: spacing.sm },
            ]}
            numberOfLines={2}
          >
            {campaign.name}
          </Text>
          <StatusBadge status={campaign.status} />
        </View>

        {!!campaign.industry && (
          <Text
            style={[
              typography.bodySmall,
              { color: colors.text.tertiary, marginBottom: spacing.sm },
            ]}
          >
            {t(`mobile.industries.${campaign.industry}`, {
              defaultValue: campaign.industry,
            })}
          </Text>
        )}

        {/* Budget progress */}
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.surfaceSecondary,
            overflow: 'hidden',
            marginBottom: spacing.xs,
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              backgroundColor: progress > 0.9 ? colors.warning : colors.primary,
              borderRadius: 3,
            }}
          />
        </View>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <Text style={[typography.caption, { color: colors.text.secondary }]}>
            {t('mobile.dashboard.spentOf', {
              spent: formatCurrency(budgetSpent),
              total: formatCurrency(budgetTotal),
            })}
          </Text>
          <Text style={[typography.caption, { color: colors.text.tertiary }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const {
    data: kpis,
    isLoading: kpisLoading,
    refetch: refetchKpis,
    isRefetching: kpisRefetching,
  } = useDashboardKpis();
  const {
    data: campaignsResult,
    isLoading: campaignsLoading,
    refetch: refetchCampaigns,
    isRefetching: campaignsRefetching,
  } = useCampaigns();

  const campaigns = campaignsResult?.data ?? [];
  const refreshing = kpisRefetching || campaignsRefetching;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refetchKpis();
              refetchCampaigns();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
          }}
        >
          <Text style={[typography.headingLarge, { color: colors.text.primary }]}>
            {t('mobile.dashboard.title')}
          </Text>
        </View>

        {/* KPI cards */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            marginBottom: spacing.sm,
          }}
        >
          {kpisLoading ? (
            <>
              <Skeleton height={96} style={{ width: '48%', marginBottom: spacing.md, borderRadius: borderRadius.lg }} />
              <Skeleton height={96} style={{ width: '48%', marginBottom: spacing.md, borderRadius: borderRadius.lg }} />
              <Skeleton height={96} style={{ width: '48%', marginBottom: spacing.md, borderRadius: borderRadius.lg }} />
              <Skeleton height={96} style={{ width: '48%', marginBottom: spacing.md, borderRadius: borderRadius.lg }} />
            </>
          ) : (
            <>
              <KpiCard
                icon="eye-outline"
                label={t('mobile.dashboard.kpi.impressions')}
                value={formatNumber(kpis?.totalImpressions ?? 0)}
                change={kpis?.impressionChange}
              />
              <KpiCard
                icon="hand-left-outline"
                label={t('mobile.dashboard.kpi.clicks')}
                value={formatNumber(kpis?.totalClicks ?? 0)}
                change={kpis?.clickChange}
              />
              <KpiCard
                icon="pulse-outline"
                label={t('mobile.dashboard.kpi.ctr')}
                value={`${(kpis?.avgCTR ?? 0).toFixed(1)}%`}
                change={kpis?.ctrChange}
              />
              <KpiCard
                icon="cash-outline"
                label={t('mobile.dashboard.kpi.spend')}
                value={formatCurrency(kpis?.totalSpend ?? 0)}
                change={kpis?.spendChange}
              />
            </>
          )}
        </View>

        {/* Campaigns */}
        <View style={{ paddingHorizontal: spacing.md }}>
          <Text
            style={[
              typography.headingSmall,
              { color: colors.text.primary, marginBottom: spacing.sm },
            ]}
          >
            {t('mobile.dashboard.campaignsTitle')}
          </Text>

          {campaignsLoading ? (
            <>
              <Skeleton height={120} style={{ marginBottom: spacing.md, borderRadius: borderRadius.lg }} />
              <Skeleton height={120} style={{ marginBottom: spacing.md, borderRadius: borderRadius.lg }} />
              <Skeleton height={120} style={{ marginBottom: spacing.md, borderRadius: borderRadius.lg }} />
            </>
          ) : campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))
          ) : (
            <EmptyState
              icon="megaphone-outline"
              title={t('mobile.dashboard.noCampaigns')}
              message={t('mobile.dashboard.noCampaignsMessage')}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
