import React, { useState } from 'react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAdvertiserReviews, useSetAdvertiserApproval } from '@/hooks/useOnboarding';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { UserCheck, Check, X, Mail, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdvertiserApproval } from '@/types';

const tabs: { key: AdvertiserApproval; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export function AdminAdvertisersPage() {
  const [tab, setTab] = useState<AdvertiserApproval>('pending');
  const { data: advertisers, isLoading } = useAdvertiserReviews(tab);
  const setApproval = useSetAdvertiserApproval();

  const act = async (id: string, action: 'approve' | 'reject') => {
    try {
      await setApproval.mutateAsync({ id, action });
      toast.success(action === 'approve' ? 'Advertiser approved' : 'Advertiser rejected');
    } catch {
      toast.error('Action failed');
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Advertiser Approvals"
          subtitle="Review and approve advertiser accounts before they can run ads."
        />

        <div className="flex w-fit gap-1 rounded-xl bg-bg-secondary p-1 dark:bg-slate-800">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                tab === t.key
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card>
          {isLoading ? (
            <div className="py-12 text-center text-text-muted">Loading…</div>
          ) : !advertisers || advertisers.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={<UserCheck />}
              title={`No ${tab} advertisers`}
              description={
                tab === 'pending'
                  ? 'New advertiser sign-ups awaiting review will appear here.'
                  : `There are no ${tab} advertisers.`
              }
            />
          ) : (
            <ul className="divide-y divide-border-color dark:divide-slate-800">
              {advertisers.map((a) => (
                <li key={a.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      {getInitials(a.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text-primary">{a.name}</p>
                      <p className="truncate text-sm text-text-secondary">{a.email}</p>
                      <p className="text-xs text-text-muted">Joined {formatDate(a.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Chip ok={a.email_verified} icon={<Mail className="h-3 w-3" />} label="Email" />
                    <Chip
                      ok={a.billing_ready}
                      icon={<CreditCard className="h-3 w-3" />}
                      label="Billing"
                    />
                  </div>

                  {tab === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-danger-600"
                        onClick={() => act(a.id, 'reject')}
                        loading={setApproval.isPending}
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => act(a.id, 'approve')} loading={setApproval.isPending}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                    </div>
                  ) : (
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                        a.advertiser_approval === 'approved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300'
                      )}
                    >
                      {a.advertiser_approval}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}

function Chip({ ok, icon, label }: { ok: boolean; icon: React.ReactNode; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
        ok
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'bg-bg-secondary text-text-muted dark:bg-slate-700'
      )}
    >
      {icon} {label}
    </span>
  );
}
