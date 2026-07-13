import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useCampaignKpis,
  useAIRecommendations,
  useApplyRecommendation,
  useDismissRecommendation,
  useAnomalies,
  useResolveAnomaly,
  useBenchmarks,
  useCampaignStory,
  useCampaignTeam,
  useAttributionDevices,
} from '@/hooks/useDashboard';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Skeleton } from '@/components/dashboard/Skeleton';
import { formatNumber, formatCurrency, formatDate } from '@/lib/format';
import { AnomalySeverity } from '@/types';

type TabKey = 'overview' | 'ai' | 'anomalies' | 'story' | 'team' | 'attribution';

const TABS: TabKey[] = ['overview', 'ai', 'anomalies', 'story', 'team', 'attribution'];

function SectionTitle({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text
      style={[
        typography.headingSmall,
        { color: colors.text.primary, marginBottom: spacing.sm },
      ]}
    >
      {title}
    </Text>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}
    >
      <Text style={[typography.bodyMedium, { color: colors.text.secondary }]}>
        {label}
      </Text>
      <Text
        style={[
          typography.bodyMedium,
          { color: colors.text.primary, fontFamily: fontFamily.medium, flexShrink: 1, marginLeft: spacing.md },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[typography.headingMedium, { color: colors.text.primary }]}>
        {value}
      </Text>
      <Text
        style={[typography.caption, { color: colors.text.tertiary, marginTop: 2 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function TabLoading() {
  return (
    <View style={{ gap: spacing.md }}>
      <Skeleton height={80} style={{ borderRadius: borderRadius.lg }} />
      <Skeleton height={120} style={{ borderRadius: borderRadius.lg }} />
      <Skeleton height={60} style={{ borderRadius: borderRadius.lg }} />
    </View>
  );
}

// ---------------- Overview tab ----------------

function OverviewTab({ campaignId }: { campaignId: string }) {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: campaign, isLoading } = useCampaign(campaignId);
  const { data: kpis } = useCampaignKpis(campaignId);
  const { data: benchmarks } = useBenchmarks(campaignId);

  if (isLoading) return <TabLoading />;
  if (!campaign) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title={t('mobile.dashboard.campaignNotFound')}
      />
    );
  }

  const budgetTotal = campaign.budget_total ?? 0;
  const budgetSpent = campaign.budget_spent ?? 0;

  return (
    <View>
      {/* Metrics */}
      <SectionTitle title={t('mobile.dashboard.overview.metrics')} />
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row' }}>
          <MetricRow
            label={t('mobile.dashboard.kpi.impressions')}
            value={formatNumber(kpis?.totalImpressions ?? 0)}
          />
          <MetricRow
            label={t('mobile.dashboard.kpi.clicks')}
            value={formatNumber(kpis?.totalClicks ?? 0)}
          />
          <MetricRow
            label={t('mobile.dashboard.kpi.ctr')}
            value={`${(kpis?.avgCTR ?? campaign.ctr ?? 0).toFixed(1)}%`}
          />
          <MetricRow
            label={t('mobile.dashboard.kpi.spend')}
            value={formatCurrency(kpis?.totalSpend ?? budgetSpent)}
          />
        </View>
      </Card>

      {/* Campaign info */}
      <SectionTitle title={t('mobile.dashboard.overview.info')} />
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ marginBottom: spacing.sm }}>
          <StatusBadge status={campaign.status} />
        </View>
        <InfoRow
          label={t('mobile.dashboard.overview.budgetTotal')}
          value={formatCurrency(budgetTotal)}
        />
        <InfoRow
          label={t('mobile.dashboard.overview.budgetSpent')}
          value={formatCurrency(budgetSpent)}
        />
        <InfoRow
          label={t('mobile.dashboard.overview.startDate')}
          value={formatDate(campaign.start_date)}
        />
        <InfoRow
          label={t('mobile.dashboard.overview.endDate')}
          value={formatDate(campaign.end_date)}
        />
        <InfoRow
          label={t('mobile.dashboard.overview.industry')}
          value={
            campaign.industry
              ? t(`mobile.industries.${campaign.industry}`, {
                  defaultValue: campaign.industry,
                })
              : '—'
          }
        />
      </Card>

      {/* Benchmarks */}
      {benchmarks && benchmarks.comparisons.length > 0 && (
        <>
          <SectionTitle title={t('mobile.dashboard.overview.benchmarks')} />
          <Card style={{ marginBottom: spacing.lg }}>
            {benchmarks.comparisons.map((c) => {
              const max = Math.max(c.your_value, c.industry_avg, 0.0001);
              return (
                <View key={c.metric} style={{ marginBottom: spacing.md }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: spacing.xs,
                    }}
                  >
                    <Text
                      style={[typography.bodySmall, { color: colors.text.secondary }]}
                    >
                      {c.metric}
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: c.is_above_avg ? colors.accent : colors.warning,
                        },
                      ]}
                    >
                      {c.is_above_avg
                        ? t('mobile.dashboard.overview.aboveAvg')
                        : t('mobile.dashboard.overview.belowAvg')}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.surfaceSecondary,
                      marginBottom: spacing.xs,
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${(c.your_value / max) * 100}%`,
                        backgroundColor: colors.primary,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                  <Text style={[typography.caption, { color: colors.text.tertiary }]}>
                    {t('mobile.dashboard.overview.yoursVsIndustry', {
                      yours: c.your_value,
                      industry: c.industry_avg,
                    })}
                  </Text>
                </View>
              );
            })}
          </Card>
        </>
      )}
    </View>
  );
}

// ---------------- AI tab ----------------

function AITab({ campaignId }: { campaignId: string }) {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: recommendations, isLoading } = useAIRecommendations(campaignId);
  const applyMutation = useApplyRecommendation(campaignId);
  const dismissMutation = useDismissRecommendation(campaignId);

  if (isLoading) return <TabLoading />;

  if (!recommendations || recommendations.length === 0) {
    return (
      <EmptyState
        icon="sparkles-outline"
        title={t('mobile.dashboard.ai.empty')}
        message={t('mobile.dashboard.ai.emptyMessage')}
      />
    );
  }

  const statusColor: Record<string, string> = {
    pending: colors.warning,
    applied: colors.accent,
    dismissed: colors.text.tertiary,
  };

  return (
    <View>
      {recommendations.map((rec) => (
        <Card key={rec.id} style={{ marginBottom: spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={[
                typography.headingSmall,
                { color: colors.text.primary, flex: 1, marginRight: spacing.sm },
              ]}
            >
              {rec.title}
            </Text>
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.full,
                backgroundColor: `${statusColor[rec.status]}1A`,
              }}
            >
              <Text
                style={[typography.caption, { color: statusColor[rec.status] }]}
              >
                {t(`mobile.dashboard.ai.status.${rec.status}`)}
              </Text>
            </View>
          </View>

          <Text
            style={[
              typography.bodyMedium,
              { color: colors.text.secondary, marginBottom: spacing.sm },
            ]}
          >
            {rec.description}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: spacing.md,
              marginBottom: rec.status === 'pending' ? spacing.md : 0,
            }}
          >
            {!!rec.expected_impact && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Ionicons name="trending-up-outline" size={14} color={colors.accent} />
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  {rec.expected_impact}
                </Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Ionicons name="analytics-outline" size={14} color={colors.text.tertiary} />
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                {t('mobile.dashboard.ai.confidence', {
                  value: Math.round((rec.confidence ?? 0) * 100),
                })}
              </Text>
            </View>
          </View>

          {rec.status === 'pending' && (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                title={t('mobile.dashboard.ai.apply')}
                onPress={() => applyMutation.mutate(rec.id)}
                size="sm"
                loading={applyMutation.isPending}
                style={{ flex: 1 }}
              />
              <Button
                title={t('mobile.dashboard.ai.dismiss')}
                onPress={() => dismissMutation.mutate(rec.id)}
                variant="outline"
                size="sm"
                loading={dismissMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}

// ---------------- Anomalies tab ----------------

function AnomaliesTab({ campaignId }: { campaignId: string }) {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: anomalies, isLoading } = useAnomalies(campaignId);
  const resolveMutation = useResolveAnomaly(campaignId);

  if (isLoading) return <TabLoading />;

  if (!anomalies || anomalies.length === 0) {
    return (
      <EmptyState
        icon="shield-checkmark-outline"
        title={t('mobile.dashboard.anomalies.empty')}
        message={t('mobile.dashboard.anomalies.emptyMessage')}
      />
    );
  }

  const severityColor: Record<AnomalySeverity, string> = {
    low: colors.text.tertiary,
    medium: colors.warning,
    high: colors.danger,
    critical: colors.dangerDark,
  };

  return (
    <View>
      {anomalies.map((anomaly) => {
        const color = severityColor[anomaly.severity] ?? colors.text.tertiary;
        const isResolved = !!anomaly.resolved_at;
        return (
          <Card key={anomaly.id} style={{ marginBottom: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.xs,
              }}
            >
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.full,
                  backgroundColor: `${color}1A`,
                }}
              >
                <Text style={[typography.caption, { color }]}>
                  {t(`mobile.dashboard.anomalies.severity.${anomaly.severity}`)}
                </Text>
              </View>
              {isResolved && (
                <View
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.full,
                    backgroundColor: `${colors.accent}1A`,
                  }}
                >
                  <Text style={[typography.caption, { color: colors.accent }]}>
                    {t('mobile.dashboard.anomalies.resolved')}
                  </Text>
                </View>
              )}
              {anomaly.auto_paused && (
                <Ionicons name="pause-circle-outline" size={16} color={colors.warning} />
              )}
            </View>

            <Text
              style={[
                typography.bodyMedium,
                { color: colors.text.primary, marginBottom: spacing.sm },
              ]}
            >
              {anomaly.description}
            </Text>

            <InfoRow
              label={t('mobile.dashboard.anomalies.metric')}
              value={anomaly.metric}
            />
            <InfoRow
              label={t('mobile.dashboard.anomalies.currentValue')}
              value={String(anomaly.current_value)}
            />
            <InfoRow
              label={t('mobile.dashboard.anomalies.threshold')}
              value={String(anomaly.threshold_value)}
            />
            <InfoRow
              label={t('mobile.dashboard.anomalies.detectedAt')}
              value={formatDate(anomaly.detected_at)}
            />

            {!isResolved && (
              <Button
                title={t('mobile.dashboard.anomalies.resolve')}
                onPress={() => resolveMutation.mutate(anomaly.id)}
                size="sm"
                loading={resolveMutation.isPending}
                style={{ marginTop: spacing.md }}
              />
            )}
          </Card>
        );
      })}
    </View>
  );
}

// ---------------- Story tab ----------------

function StoryTab({ campaignId }: { campaignId: string }) {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: story, isLoading } = useCampaignStory(campaignId);

  if (isLoading) return <TabLoading />;

  if (!story || !story.chapters || story.chapters.length === 0) {
    return (
      <EmptyState
        icon="book-outline"
        title={t('mobile.dashboard.story.empty')}
      />
    );
  }

  return (
    <View>
      {story.is_preliminary && (
        <Card style={{ marginBottom: spacing.md, backgroundColor: `${colors.warning}14` }}>
          <Text style={[typography.bodySmall, { color: colors.warningDark }]}>
            {t('mobile.dashboard.story.preliminary')}
          </Text>
        </Card>
      )}

      {story.chapters.map((chapter) => (
        <Card key={chapter.number} style={{ marginBottom: spacing.md }}>
          <Text
            style={[
              typography.caption,
              { color: colors.primary, marginBottom: spacing.xs },
            ]}
          >
            {t('mobile.dashboard.story.chapter', { number: chapter.number })}
          </Text>
          <Text
            style={[
              typography.headingSmall,
              { color: colors.text.primary, marginBottom: spacing.sm },
            ]}
          >
            {chapter.title}
          </Text>
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.text.secondary, marginBottom: spacing.sm },
            ]}
          >
            {chapter.narrative}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surfaceSecondary,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
            }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[typography.bodyMedium, { color: colors.text.primary, fontFamily: fontFamily.semibold }]}>
                {formatNumber(chapter.stats.impressions)}
              </Text>
              <Text style={[typography.caption, { color: colors.text.tertiary }]}>
                {t('mobile.dashboard.kpi.impressions')}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[typography.bodyMedium, { color: colors.text.primary, fontFamily: fontFamily.semibold }]}>
                {formatNumber(chapter.stats.clicks)}
              </Text>
              <Text style={[typography.caption, { color: colors.text.tertiary }]}>
                {t('mobile.dashboard.kpi.clicks')}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[typography.bodyMedium, { color: colors.text.primary, fontFamily: fontFamily.semibold }]}>
                {formatCurrency(chapter.stats.spend)}
              </Text>
              <Text style={[typography.caption, { color: colors.text.tertiary }]}>
                {t('mobile.dashboard.kpi.spend')}
              </Text>
            </View>
          </View>
        </Card>
      ))}

      {story.key_insights.length > 0 && (
        <>
          <SectionTitle title={t('mobile.dashboard.story.keyInsights')} />
          <Card style={{ marginBottom: spacing.md }}>
            {story.key_insights.map((insight, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  gap: spacing.sm,
                  marginBottom: i < story.key_insights.length - 1 ? spacing.sm : 0,
                }}
              >
                <Text style={[typography.bodyMedium, { color: colors.primary }]}>•</Text>
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: colors.text.secondary, flex: 1 },
                  ]}
                >
                  {insight}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {story.recommendations.length > 0 && (
        <>
          <SectionTitle title={t('mobile.dashboard.story.recommendations')} />
          <Card style={{ marginBottom: spacing.md }}>
            {story.recommendations.map((rec, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  gap: spacing.sm,
                  marginBottom: i < story.recommendations.length - 1 ? spacing.sm : 0,
                }}
              >
                <Text style={[typography.bodyMedium, { color: colors.accent }]}>•</Text>
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: colors.text.secondary, flex: 1 },
                  ]}
                >
                  {rec}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </View>
  );
}

// ---------------- Team tab ----------------

function TeamTab({ campaignId }: { campaignId: string }) {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: members, isLoading } = useCampaignTeam(campaignId);

  if (isLoading) return <TabLoading />;

  if (!members || members.length === 0) {
    return (
      <EmptyState
        icon="people-outline"
        title={t('mobile.dashboard.team.empty')}
      />
    );
  }

  const roleColor: Record<string, string> = {
    admin: colors.danger,
    editor: colors.primary,
    viewer: colors.text.tertiary,
  };

  return (
    <View>
      {members.map((member) => {
        const color = roleColor[member.role] ?? colors.text.tertiary;
        return (
          <Card key={member.id} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surfaceSecondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={[typography.headingSmall, { color: colors.text.secondary }]}>
                  {(member.name || member.email || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[typography.bodyLarge, { color: colors.text.primary, fontFamily: fontFamily.medium }]}
                  numberOfLines={1}
                >
                  {member.name || member.email}
                </Text>
                {!!member.email && !!member.name && (
                  <Text
                    style={[typography.bodySmall, { color: colors.text.tertiary }]}
                    numberOfLines={1}
                  >
                    {member.email}
                  </Text>
                )}
              </View>
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.full,
                  backgroundColor: `${color}1A`,
                }}
              >
                <Text style={[typography.caption, { color }]}>
                  {t(`mobile.dashboard.team.roles.${member.role}`, {
                    defaultValue: member.role,
                  })}
                </Text>
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

// ---------------- Attribution tab ----------------

function AttributionTab({ campaignId }: { campaignId: string }) {
  const { t } = useTranslation();
  const colors = useColors();
  const { data, isLoading } = useAttributionDevices(campaignId);

  if (isLoading) return <TabLoading />;

  const devices = data?.devices ?? [];
  const paths = data?.paths ?? [];

  if (devices.length === 0 && paths.length === 0) {
    return (
      <EmptyState
        icon="phone-portrait-outline"
        title={t('mobile.dashboard.attribution.empty')}
        message={t('mobile.dashboard.attribution.emptyMessage')}
      />
    );
  }

  const maxImpressions = Math.max(...devices.map((d) => d.impressions), 1);

  return (
    <View>
      {devices.length > 0 && (
        <>
          <SectionTitle title={t('mobile.dashboard.attribution.devices')} />
          <Card style={{ marginBottom: spacing.lg }}>
            {devices.map((device) => (
              <View key={device.device_type} style={{ marginBottom: spacing.md }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: spacing.xs,
                  }}
                >
                  <Text
                    style={[
                      typography.bodyMedium,
                      { color: colors.text.primary, textTransform: 'capitalize' },
                    ]}
                  >
                    {device.device_type}
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.tertiary }]}>
                    {formatNumber(device.impressions)} · {t('mobile.dashboard.attribution.ctr')}{' '}
                    {(device.ctr ?? 0).toFixed(1)}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.surfaceSecondary,
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${(device.impressions / maxImpressions) * 100}%`,
                      backgroundColor: colors.primary,
                      borderRadius: 4,
                    }}
                  />
                </View>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text.tertiary, marginTop: spacing.xs },
                  ]}
                >
                  {t('mobile.dashboard.attribution.clicksConversions', {
                    clicks: formatNumber(device.clicks),
                    conversions: formatNumber(device.conversions),
                  })}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {paths.length > 0 && (
        <>
          <SectionTitle title={t('mobile.dashboard.attribution.crossDevicePaths')} />
          <Card>
            {paths.map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: spacing.sm,
                  borderBottomWidth: i < paths.length - 1 ? 1 : 0,
                  borderBottomColor: colors.borderLight,
                }}
              >
                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, marginRight: spacing.sm }}>
                  {item.path.map((step, j) => (
                    <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      {j > 0 && (
                        <Ionicons name="arrow-forward" size={12} color={colors.text.tertiary} />
                      )}
                      <View
                        style={{
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                          borderRadius: borderRadius.full,
                          backgroundColor: colors.surfaceSecondary,
                        }}
                      >
                        <Text style={[typography.caption, { color: colors.text.secondary }]}>
                          {step}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.text.primary, fontFamily: fontFamily.semibold },
                  ]}
                >
                  {t('mobile.dashboard.attribution.conversions', {
                    count: item.conversions,
                  })}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </View>
  );
}

// ---------------- Screen ----------------

export default function CampaignDetailScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaignId = Array.isArray(id) ? id[0] : id;
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const { data: campaign, isLoading, refetch, isRefetching } = useCampaign(campaignId);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <LoadingScreen message={t('mobile.common.loading')} />
      </>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <Stack.Screen options={{ title: campaign?.name ?? t('mobile.dashboard.campaignTitle') }} />

      {/* Segmented tab bar */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? colors.primary : 'transparent',
                }}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      fontFamily: isActive ? fontFamily.semibold : fontFamily.regular,
                      color: isActive ? colors.primary : colors.text.secondary,
                    },
                  ]}
                >
                  {t(`mobile.dashboard.tabs.${tab}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'overview' && <OverviewTab campaignId={campaignId} />}
        {activeTab === 'ai' && <AITab campaignId={campaignId} />}
        {activeTab === 'anomalies' && <AnomaliesTab campaignId={campaignId} />}
        {activeTab === 'story' && <StoryTab campaignId={campaignId} />}
        {activeTab === 'team' && <TeamTab campaignId={campaignId} />}
        {activeTab === 'attribution' && <AttributionTab campaignId={campaignId} />}
      </ScrollView>
    </SafeAreaView>
  );
}
