import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useVipCriteria,
  useUpdateVipCriteria,
  useMultiplierRules,
  useUpdateMultiplierRules,
  type VipCriteria,
  type MultiplierRules,
} from '@/hooks/useAdminTools';
import { Sparkles, RotateCcw, Gauge, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/ui/PageTransition';

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
    <PageTransition><div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeader title={t('dashboard.adminLoyalty.title')} subtitle={t('dashboard.adminLoyalty.intro')} />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Card shape="soft" className="border-white/80 shadow-[0_14px_40px_rgba(7,20,49,0.055)] dark:border-slate-800">
        <CardHeader
          title={t('dashboard.adminLoyalty.criteriaTitle')}
          subtitle={t('dashboard.adminLoyalty.criteriaSubtitle')}
        />

        {isLoading || !form ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIELDS.map((field) => (
                <div key={field.key} className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40"><Input label={t(`dashboard.adminLoyalty.${field.i18n}`)} type="number" value={form[field.key]} onChange={(e) => set(field.key, Number(e.target.value))} hint={t(`dashboard.adminLoyalty.${field.i18n}Hint`)} /></div>
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
      <Card shape="soft" className="overflow-hidden border-0 bg-[#07142f] p-7 text-white"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary-400 text-primary-900"><Sparkles className="h-5 w-5" /></span><h2 className="mt-8 text-2xl font-black tracking-[-0.04em]">VIP rules, made transparent.</h2><p className="mt-3 text-sm leading-6 text-white/55">These thresholds determine when customers qualify for VIP status. Keep them achievable, measurable, and aligned with genuine loyalty.</p><div className="mt-8 space-y-3 text-xs text-white/45"><p>• Changes apply platform-wide.</p><p>• Values are always stored as whole numbers.</p><p>• Defaults remain available as a safe reset.</p></div></Card>
      </div>

      <MultiplierRulesCard />
    </div></PageTransition>
  );
}

/**
 * Editor for the reward-multiplier rules (Phase 3.3). Streak tiers and the VIP
 * multiplier are administrator-configurable, but the server clamps every value
 * to a hard ceiling — the limits are shown here so the ceiling is never a
 * surprise, and the saved response reflects what actually persisted.
 */
function MultiplierRulesCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useMultiplierRules();
  const update = useUpdateMultiplierRules();
  const [form, setForm] = useState<MultiplierRules | null>(null);

  useEffect(() => {
    if (data?.rules) setForm(data.rules);
  }, [data?.rules]);

  const limits = data?.limits;

  const setTier = (i: number, patch: Partial<{ min: number; multiplier: number }>) =>
    setForm((f) =>
      f ? { ...f, streak_tiers: f.streak_tiers.map((tr, idx) => (idx === i ? { ...tr, ...patch } : tr)) } : f
    );
  const addTier = () =>
    setForm((f) => (f ? { ...f, streak_tiers: [...f.streak_tiers, { min: 1, multiplier: 1 }] } : f));
  const removeTier = (i: number) =>
    setForm((f) => (f ? { ...f, streak_tiers: f.streak_tiers.filter((_, idx) => idx !== i) } : f));

  return (
    <Card shape="soft" className="border-white/80 shadow-[0_14px_40px_rgba(7,20,49,0.055)] dark:border-slate-800">
      <CardHeader
        title={t('dashboard.adminLoyalty.multiplier.title')}
        subtitle={t('dashboard.adminLoyalty.multiplier.subtitle')}
      />

      {isLoading || !form ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <>
          <p className="mb-3 flex items-center gap-1.5 text-xs text-text-muted">
            <Gauge className="h-3.5 w-3.5" />
            {limits
              ? t('dashboard.adminLoyalty.multiplier.ceilingNote', {
                  streak: limits.max_streak_multiplier,
                  vip: limits.max_vip_multiplier,
                  effective: limits.max_effective_multiplier,
                })
              : null}
          </p>

          {/* Streak tiers */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-text-primary">
              {t('dashboard.adminLoyalty.multiplier.tiers')}
            </p>
            {form.streak_tiers.map((tier, i) => (
              <div key={i} className="flex items-end gap-2">
                <Input
                  label={t('dashboard.adminLoyalty.multiplier.minDays')}
                  type="number"
                  value={tier.min}
                  onChange={(e) => setTier(i, { min: Number(e.target.value) })}
                />
                <Input
                  label={t('dashboard.adminLoyalty.multiplier.multiplier')}
                  type="number"
                  step="0.05"
                  value={tier.multiplier}
                  onChange={(e) => setTier(i, { multiplier: Number(e.target.value) })}
                />
                <Button
                  variant="ghost"
                  className="mb-1 text-danger-600"
                  onClick={() => removeTier(i)}
                  aria-label={t('dashboard.adminLoyalty.multiplier.removeTier')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4" /> {t('dashboard.adminLoyalty.multiplier.addTier')}
            </Button>
          </div>

          {/* VIP multiplier + bonus threshold */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('dashboard.adminLoyalty.multiplier.vipMultiplier')}
              type="number"
              step="0.05"
              value={form.vip_multiplier}
              onChange={(e) => setForm((f) => (f ? { ...f, vip_multiplier: Number(e.target.value) } : f))}
              hint={limits ? t('dashboard.adminLoyalty.multiplier.max', { n: limits.max_vip_multiplier }) : undefined}
            />
            <Input
              label={t('dashboard.adminLoyalty.multiplier.bonusThreshold')}
              type="number"
              value={form.bonus_threshold}
              onChange={(e) => setForm((f) => (f ? { ...f, bonus_threshold: Number(e.target.value) } : f))}
              hint={t('dashboard.adminLoyalty.multiplier.bonusThresholdHint')}
            />
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Button onClick={() => form && update.mutate(form)} loading={update.isPending}>
              <Gauge className="mr-1.5 h-4 w-4" /> {t('dashboard.adminLoyalty.save')}
            </Button>
            {data?.defaults && (
              <Button variant="ghost" onClick={() => setForm(data.defaults)}>
                <RotateCcw className="mr-1.5 h-4 w-4" /> {t('dashboard.adminLoyalty.reset')}
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
