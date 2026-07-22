import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useVipCriteria, useUpdateVipCriteria, type VipCriteria } from '@/hooks/useAdminTools';
import { Sparkles, RotateCcw } from 'lucide-react';

// Labels and hints are looked up per key under `dashboard.adminLoyalty`.
const FIELDS: { key: keyof VipCriteria; i18n: string }[] = [
  { key: 'min_merchant_visits', i18n: 'minVisits' },
  { key: 'min_purchases', i18n: 'minPurchases' },
  { key: 'min_reviews', i18n: 'minReviews' },
  { key: 'min_engagement_score', i18n: 'minScore' },
];

export function AdminLoyaltyPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useVipCriteria();
  const updateCriteria = useUpdateVipCriteria();
  const [form, setForm] = useState<VipCriteria | null>(null);

  useEffect(() => {
    if (data?.criteria) setForm(data.criteria);
  }, [data?.criteria]);

  const set = (key: keyof VipCriteria, value: number) =>
    setForm((f) => (f ? { ...f, [key]: Math.max(0, Math.floor(value)) } : f));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.adminLoyalty.title')}</h1>
        <p className="text-sm text-text-secondary mt-1">
          {t('dashboard.adminLoyalty.intro')}
        </p>
      </div>

      <Card>
        <CardHeader
          title={t('dashboard.adminLoyalty.criteriaTitle')}
          subtitle={t('dashboard.adminLoyalty.criteriaSubtitle')}
        />

        {isLoading || !form ? (
          <p className="py-8 text-center text-sm text-text-muted">{t('dashboard.common.loading')}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIELDS.map((field) => (
                <Input
                  key={field.key}
                  label={t(`dashboard.adminLoyalty.${field.i18n}`)}
                  type="number"
                  value={form[field.key]}
                  onChange={(e) => set(field.key, Number(e.target.value))}
                  hint={t(`dashboard.adminLoyalty.${field.i18n}Hint`)}
                />
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <Button onClick={() => updateCriteria.mutate(form)} loading={updateCriteria.isPending}>
                <Sparkles className="h-4 w-4 mr-1.5" /> {t('dashboard.adminLoyalty.save')}
              </Button>
              {data?.defaults && (
                <Button variant="ghost" onClick={() => setForm(data.defaults)}>
                  <RotateCcw className="h-4 w-4 mr-1.5" /> {t('dashboard.adminLoyalty.reset')}
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
