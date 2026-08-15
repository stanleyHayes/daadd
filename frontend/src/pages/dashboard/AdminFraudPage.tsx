import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useFraudSignals,
  useScanFraud,
  useSetFraudStatus,
  type FraudStatus,
  type FraudSeverity,
} from '@/hooks/useFraud';
import { cn, formatDate } from '@/lib/utils';
import { ShieldAlert, RefreshCw, Search, XCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS: FraudStatus[] = ['open', 'reviewing', 'dismissed', 'actioned'];

/** Status actions offered on a row, given its current status. */
const NEXT: Record<FraudStatus, FraudStatus[]> = {
  open: ['reviewing', 'dismissed', 'actioned'],
  reviewing: ['dismissed', 'actioned'],
  dismissed: ['reviewing'],
  actioned: ['reviewing'],
};

const SEVERITY_STYLE: Record<FraudSeverity, string> = {
  critical: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-bg-secondary text-text-muted dark:bg-slate-700',
};

const ACTION_ICON: Record<FraudStatus, typeof Search> = {
  reviewing: Search,
  dismissed: XCircle,
  actioned: CheckCircle2,
  open: Search,
};

export function AdminFraudPage() {
  const [tab, setTab] = useState<FraudStatus>('open');
  const { t } = useTranslation();
  const { data: signals, isLoading } = useFraudSignals(tab);
  const scan = useScanFraud();
  const setStatus = useSetFraudStatus();

  const runScan = async () => {
    try {
      const r = await scan.mutateAsync();
      toast.success(t('dashboard.fraud.scanDone', { created: r.created, refreshed: r.refreshed }));
    } catch {
      toast.error(t('dashboard.fraud.scanFailed'));
    }
  };

  const act = async (id: string, status: FraudStatus) => {
    try {
      await setStatus.mutateAsync({ id, status });
      toast.success(t(`dashboard.fraud.set.${status}`));
    } catch {
      toast.error(t('dashboard.fraud.actionFailed'));
    }
  };

  return (
    <PageTransition>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader title={t('dashboard.fraud.title')} subtitle={t('dashboard.fraud.subtitle')} />
          <Button variant="outline" onClick={runScan} loading={scan.isPending}>
            <RefreshCw className="h-4 w-4" /> {t('dashboard.fraud.scan')}
          </Button>
        </div>

        <div className="inline-flex w-fit flex-wrap gap-1 rounded-2xl border border-white bg-white p-1.5 shadow-[0_10px_30px_rgba(7,20,49,0.05)] dark:border-slate-800 dark:bg-slate-900">
          {TABS.map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'rounded-xl px-5 py-2 text-sm font-bold transition-all',
                tab === key
                  ? 'bg-primary-900 text-white shadow-sm dark:bg-secondary-400 dark:text-primary-900'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t(`dashboard.fraud.status.${key}`)}
            </button>
          ))}
        </div>

        <Card shape="soft" className="border-white/80 shadow-[0_14px_40px_rgba(7,20,49,0.055)] dark:border-slate-800">
          {isLoading ? (
            <div className="py-12 text-center text-text-muted">{t('dashboard.common.loading')}</div>
          ) : !signals || signals.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={<ShieldAlert />}
              title={t('dashboard.fraud.emptyTitle', { status: t(`dashboard.fraud.status.${tab}`).toLowerCase() })}
              description={t('dashboard.fraud.emptyDesc')}
            />
          ) : (
            <ul className="divide-y divide-border-color dark:divide-slate-800">
              {signals.map((s) => (
                <li key={s._id} className="flex flex-col gap-3 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold uppercase', SEVERITY_STYLE[s.severity])}>
                          {t(`dashboard.fraud.severity.${s.severity}`)}
                        </span>
                        <span className="text-sm font-semibold text-text-primary">
                          {t(`dashboard.fraud.type.${s.type}`)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">{s.description}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {t('dashboard.fraud.detected', { date: formatDate(s.detected_at) })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {NEXT[s.status].map((next) => {
                        const Icon = ACTION_ICON[next];
                        return (
                          <Button
                            key={next}
                            size="sm"
                            variant={next === 'dismissed' ? 'ghost' : 'outline'}
                            className={next === 'actioned' ? 'text-danger-600' : undefined}
                            onClick={() => act(s._id, next)}
                            loading={setStatus.isPending}
                          >
                            <Icon className="h-4 w-4" /> {t(`dashboard.fraud.action.${next}`)}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
