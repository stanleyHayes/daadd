import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCommerceSettings, useUpdateCommerceSettings, type CommerceSettings } from '@/hooks/useAdminTools';
import { Receipt, RotateCcw } from 'lucide-react';

export function AdminCommercePage() {
  const { t } = useTranslation();
  const { data, isLoading } = useCommerceSettings();
  const update = useUpdateCommerceSettings();
  const [form, setForm] = useState<CommerceSettings | null>(null);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data?.settings]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-[720px] space-y-6">
        <PageHeader title={t('dashboard.commerce.title')} subtitle={t('dashboard.commerce.subtitle')} />

        <Card>
          <CardHeader title={t('dashboard.commerce.vatTitle')} subtitle={t('dashboard.commerce.vatSubtitle')} />
          {isLoading || !form ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t('dashboard.commerce.vatRate')}
                  type="number"
                  step="1"
                  value={Math.round(form.vat_rate * 100)}
                  onChange={(e) => setForm({ ...form, vat_rate: Math.max(0, Math.min(100, Number(e.target.value))) / 100 })}
                  hint={t('dashboard.commerce.vatRateHint')}
                />
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="text-sm font-medium text-text-secondary">{t('dashboard.commerce.vatInclusive')}</p>
                  <div className="mt-2 inline-flex gap-1 rounded-xl bg-bg-secondary p-1 dark:bg-slate-700">
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        onClick={() => setForm({ ...form, vat_inclusive: v })}
                        className={
                          'rounded-lg px-3 py-1.5 text-sm font-semibold transition ' +
                          (form.vat_inclusive === v ? 'bg-primary-600 text-white' : 'text-text-secondary')
                        }
                      >
                        {t(`dashboard.commerce.${v ? 'inclusive' : 'exclusive'}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  label={t('dashboard.commerce.autoRelease')}
                  type="number"
                  value={form.auto_release_days}
                  onChange={(e) => setForm({ ...form, auto_release_days: Math.max(1, Math.floor(Number(e.target.value))) })}
                  hint={t('dashboard.commerce.autoReleaseHint')}
                />
                <Input
                  label={t('dashboard.commerce.paymentTtl')}
                  type="number"
                  value={form.payment_ttl_minutes}
                  onChange={(e) => setForm({ ...form, payment_ttl_minutes: Math.max(5, Math.floor(Number(e.target.value))) })}
                  hint={t('dashboard.commerce.paymentTtlHint')}
                />
              </div>
              <div className="mt-5 flex items-center gap-2">
                <Button onClick={() => form && update.mutate(form)} loading={update.isPending}>
                  <Receipt className="mr-1.5 h-4 w-4" /> {t('dashboard.common.save')}
                </Button>
                {data?.defaults && (
                  <Button variant="ghost" onClick={() => setForm(data.defaults)}>
                    <RotateCcw className="mr-1.5 h-4 w-4" /> {t('dashboard.commerce.reset')}
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
