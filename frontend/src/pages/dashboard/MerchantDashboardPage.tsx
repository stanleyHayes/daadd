import { MetricsCard } from '@/components/analytics/MetricsCard';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMerchantMetrics } from '@/hooks/useMerchantMetrics';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import {
  Users,
  QrCode,
  Wallet,
  Ticket,
  PiggyBank,
  Repeat,
  Star,
  Store,
} from 'lucide-react';

export function MerchantDashboardPage() {
  const { data: metrics, isLoading } = useMerchantMetrics();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.merchant.title')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('dashboard.merchant.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-28" />
          ))}
        </div>
      ) : !metrics || metrics.redemptions === 0 ? (
        <Card>
          <EmptyState
            icon={<Store />}
            title={t('dashboard.merchant.emptyTitle')}
            description={t('dashboard.merchant.emptyDesc')}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard
              icon={<Users className="h-5 w-5" />}
              label={t('dashboard.merchant.visits')}
              value={formatNumber(metrics.visits)}
              iconColor="text-primary-600"
              iconBg="bg-primary-50 dark:bg-primary-900/30"
            />
            <MetricsCard
              icon={<QrCode className="h-5 w-5" />}
              label={t('dashboard.merchant.redemptions')}
              value={formatNumber(metrics.redemptions)}
              iconColor="text-secondary-600"
              iconBg="bg-secondary-50 dark:bg-secondary-900/30"
            />
            <MetricsCard
              icon={<Wallet className="h-5 w-5" />}
              label={t('dashboard.merchant.revenue')}
              value={formatCurrency(metrics.revenue)}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            />
            <MetricsCard
              icon={<Users className="h-5 w-5" />}
              label={t('dashboard.merchant.customers')}
              value={formatNumber(metrics.customers)}
              iconColor="text-accent-600"
              iconBg="bg-accent-50 dark:bg-accent-900/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard
              icon={<Ticket className="h-5 w-5" />}
              label={t('dashboard.merchant.discountsGiven')}
              value={formatCurrency(metrics.discountsGiven)}
              iconColor="text-secondary-600"
              iconBg="bg-secondary-50 dark:bg-secondary-900/30"
            />
            <MetricsCard
              icon={<Ticket className="h-5 w-5" />}
              label={t('dashboard.merchant.discountsRedeemed')}
              value={formatCurrency(metrics.discountsRedeemed)}
              iconColor="text-warning-600"
              iconBg="bg-warning-50 dark:bg-warning-900/30"
            />
            <MetricsCard
              icon={<PiggyBank className="h-5 w-5" />}
              label={t('dashboard.merchant.avgSpend')}
              value={formatCurrency(metrics.avgCustomerSpend)}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            />
            <MetricsCard
              icon={<Ticket className="h-5 w-5" />}
              label={t('dashboard.merchant.avgDiscount')}
              value={formatCurrency(metrics.avgDiscountPerCustomer)}
              iconColor="text-primary-600"
              iconBg="bg-primary-50 dark:bg-primary-900/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricsCard
              icon={<Repeat className="h-5 w-5" />}
              label={t('dashboard.merchant.repeatRate')}
              value={formatPercentage(metrics.repeatCustomerRate)}
              iconColor="text-accent-600"
              iconBg="bg-accent-50 dark:bg-accent-900/30"
            />
            <MetricsCard
              icon={<Star className="h-5 w-5" />}
              label={t('dashboard.merchant.satisfaction', { count: metrics.reviewCount })}
              value={metrics.satisfaction > 0 ? `${metrics.satisfaction.toFixed(1)} / 5` : '—'}
              iconColor="text-warning-600"
              iconBg="bg-warning-50 dark:bg-warning-900/30"
            />
          </div>
        </>
      )}
    </div>
  );
}
