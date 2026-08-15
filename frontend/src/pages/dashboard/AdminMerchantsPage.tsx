import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useMerchantQueue,
  useSetMerchantStatus,
  type VerificationStatus,
} from '@/hooks/useMerchantVerification';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { Store, ShieldCheck, ShieldAlert, Ban, CreditCard, IdCard, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS: VerificationStatus[] = ['pending', 'verified', 'restricted', 'suspended'];

/** The status actions offered on a row, given the row's current status. */
const ACTIONS: Record<VerificationStatus, VerificationStatus[]> = {
  pending: ['verified', 'restricted', 'suspended'],
  verified: ['restricted', 'suspended'],
  restricted: ['verified', 'suspended'],
  suspended: ['verified', 'restricted'],
};

const ACTION_ICON: Record<VerificationStatus, typeof ShieldCheck> = {
  verified: ShieldCheck,
  restricted: ShieldAlert,
  suspended: Ban,
  pending: ShieldAlert,
};

export function AdminMerchantsPage() {
  const [tab, setTab] = useState<VerificationStatus>('pending');
  const { t } = useTranslation();
  const { data: merchants, isLoading } = useMerchantQueue(tab);
  const setStatus = useSetMerchantStatus();

  // A per-row review note the admin can attach to whichever action they take.
  const [notes, setNotes] = useState<Record<string, string>>({});

  const act = async (id: string, status: VerificationStatus) => {
    try {
      await setStatus.mutateAsync({ id, status, review_notes: notes[id] });
      toast.success(t(`dashboard.adminMerchants.set.${status}`));
    } catch {
      toast.error(t('dashboard.adminMerchants.actionFailed'));
    }
  };

  return (
    <PageTransition>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <PageHeader
          title={t('dashboard.adminMerchants.title')}
          subtitle={t('dashboard.adminMerchants.subtitle')}
        />

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
              {t(`dashboard.verification.status.${key}`)}
            </button>
          ))}
        </div>

        <Card shape="soft" className="border-white/80 shadow-[0_14px_40px_rgba(7,20,49,0.055)] dark:border-slate-800">
          {isLoading ? (
            <div className="py-12 text-center text-text-muted">{t('dashboard.common.loading')}</div>
          ) : !merchants || merchants.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={<Store />}
              title={t('dashboard.adminMerchants.emptyTitle', {
                status: t(`dashboard.verification.status.${tab}`).toLowerCase(),
              })}
              description={t('dashboard.adminMerchants.emptyDesc')}
            />
          ) : (
            <ul className="divide-y divide-border-color dark:divide-slate-800">
              {merchants.map((m) => (
                <li key={m._id} className="flex flex-col gap-4 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        {getInitials(m.business_name || m.merchant?.name || '?')}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text-primary">
                          {m.business_name || t('dashboard.adminMerchants.noName')}
                        </p>
                        <p className="truncate text-sm text-text-secondary">
                          {m.merchant?.name} · {m.merchant?.email}
                        </p>
                        {m.submitted_at ? (
                          <p className="text-xs text-text-muted">
                            {t('dashboard.adminMerchants.submitted', { date: formatDate(m.submitted_at) })}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {ACTIONS[m.status].map((next) => {
                        const Icon = ACTION_ICON[next];
                        return (
                          <Button
                            key={next}
                            size="sm"
                            variant={next === 'verified' ? 'primary' : 'outline'}
                            className={next !== 'verified' ? 'text-danger-600' : undefined}
                            onClick={() => act(m._id, next)}
                            loading={setStatus.isPending}
                          >
                            <Icon className="h-4 w-4" /> {t(`dashboard.adminMerchants.action.${next}`)}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* KYC detail — all sensitive values are already masked server-side. */}
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                    <Detail icon={<IdCard className="h-3.5 w-3.5" />} label={t('dashboard.verification.registrationNumber')} value={m.business_registration_number} />
                    <Detail icon={<MapPin className="h-3.5 w-3.5" />} label={t('dashboard.verification.city')} value={m.business_city} />
                    <Detail label={t('dashboard.verification.ownerName')} value={m.owner_name} />
                    <Detail label={t('dashboard.verification.idType')} value={m.owner_id_type ? t(`dashboard.verification.idTypes.${m.owner_id_type}`) : ''} />
                    <Detail label={t('dashboard.verification.idNumber')} value={m.owner_id_last4 ? `•••• ${m.owner_id_last4}` : ''} />
                    <Detail icon={<CreditCard className="h-3.5 w-3.5" />} label={t('dashboard.verification.settlement')} value={settlementLabel(m.settlement_provider, m.settlement_account_last4)} />
                  </dl>

                  <Input
                    placeholder={t('dashboard.adminMerchants.notePlaceholder')}
                    value={notes[m._id] ?? m.review_notes ?? ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [m._id]: e.target.value }))}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}

function settlementLabel(provider?: string, last4?: string): string {
  if (!provider && !last4) return '';
  return [provider, last4 ? `•••• ${last4}` : ''].filter(Boolean).join(' ');
}

function Detail({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="flex items-center gap-1 text-text-muted">
        {icon} {label}:
      </dt>
      <dd className="min-w-0 truncate font-medium text-text-primary">{value || '—'}</dd>
    </div>
  );
}
