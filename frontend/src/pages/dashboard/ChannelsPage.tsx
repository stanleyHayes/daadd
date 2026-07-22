import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardActions } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useChannels, useEstimateSpend, type AdChannel } from '@/hooks/useChannels';
import { formatCurrency } from '@/lib/utils';
import { MonitorPlay, Radio, Store, Gavel, LayoutGrid, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/ui/PageTransition';

/**
 * Ad channels (roadmap phases 3-6).
 *
 * Shows what an advertiser can actually buy today. Channels stay off until an
 * admin enables them, so this page is honest about the fact that most of these
 * need a supply agreement before they mean anything.
 */
const CHANNEL_ICONS = {
  display: LayoutGrid,
  rtb: Gavel,
  ctv: MonitorPlay,
  audio: Radio,
  retail_media: Store,
} as const;

export function ChannelsPage() {
  const { t } = useTranslation();
  const { data: channels = [], isLoading } = useChannels();
  const estimate = useEstimateSpend();
  const [selected, setSelected] = useState<AdChannel | null>(null);
  const [units, setUnits] = useState(10000);

  const runEstimate = (channel: AdChannel) => {
    setSelected(channel);
    const key =
      channel.pricing_model === 'cpc'
        ? 'clicks'
        : channel.pricing_model === 'cpcv'
          ? 'completedViews'
          : channel.pricing_model === 'cpa'
            ? 'conversions'
            : 'impressions';
    estimate.mutate({ channel_id: channel._id, [key]: units });
  };

  return (
    <PageTransition><div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeader title={t('dashboard.channels.title')} subtitle={t('dashboard.channels.intro')} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-52" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <Card shape="soft">
          <EmptyState
            variant="plain"
            icon={<LayoutGrid />}
            title={t('dashboard.channels.emptyTitle')}
            description={t('dashboard.channels.emptyDesc')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel, i) => {
            const Icon = CHANNEL_ICONS[channel.type] ?? LayoutGrid;
            return (
              <motion.div
                key={channel._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* stretch + CardActions keeps every card in the row the same
                    height with its button on the same baseline */}
                <Card stretch shape="soft" className="group min-h-64 border-white/80 shadow-[0_14px_40px_rgba(7,20,49,0.055)] transition hover:-translate-y-1 hover:border-secondary-400 dark:border-slate-800">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-primary-900 text-secondary-300 dark:bg-secondary-400 dark:text-primary-900">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text-primary">{channel.name}</p>
                      <p className="text-xs text-text-secondary">
                        {t(`dashboard.channels.types.${channel.type}`)}
                      </p>
                    </div>
                  </div>

                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-secondary">{t('dashboard.channels.pricing')}</dt>
                      <dd className="font-medium uppercase text-text-primary">
                        {channel.pricing_model}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-secondary">{t('dashboard.channels.rate')}</dt>
                      <dd className="font-medium text-text-primary">
                        {formatCurrency(channel.base_rate)} / {channel.billable_unit}
                      </dd>
                    </div>
                    {channel.provider && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-text-secondary">{t('dashboard.channels.provider')}</dt>
                        <dd className="truncate font-medium text-text-primary">
                          {channel.provider}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <CardActions>
                    <Button
                      size="sm"
                      shape="pill"
                      variant="outline"
                      onClick={() => runEstimate(channel)}
                      loading={estimate.isPending && selected?._id === channel._id}
                    >
                      <Calculator className="mr-1.5 h-4 w-4" />
                      {t('dashboard.channels.estimate')}
                    </Button>
                  </CardActions>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {estimate.data && (
        <Card shape="soft" className="border-white/80 shadow-[0_14px_40px_rgba(7,20,49,0.055)] dark:border-slate-800">
          <CardHeader
            title={t('dashboard.channels.estimateTitle', { channel: estimate.data.channel })}
            subtitle={t('dashboard.channels.estimateSubtitle')}
          />
          <div className="mb-4 max-w-xs">
            <Input
              type="number"
              min={0}
              label={t('dashboard.channels.unitsLabel', { unit: estimate.data.billable_unit })}
              value={units}
              onChange={(e) => setUnits(Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-text-secondary">{t('dashboard.channels.spend')}</p>
              <p className="text-2xl font-bold text-text-primary">
                {formatCurrency(estimate.data.spend)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">{t('dashboard.channels.rate')}</p>
              <p className="text-2xl font-bold text-text-primary">
                {formatCurrency(estimate.data.base_rate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">{t('dashboard.channels.ecpm')}</p>
              <p className="text-2xl font-bold text-text-primary">
                {estimate.data.effective_cpm === null
                  ? '—'
                  : formatCurrency(estimate.data.effective_cpm)}
              </p>
            </div>
          </div>
          {selected && (
            <Button className="mt-4" size="sm" onClick={() => runEstimate(selected)}>
              {t('dashboard.channels.recalculate')}
            </Button>
          )}
        </Card>
      )}
    </div></PageTransition>
  );
}
