import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useVipCriteria, useUpdateVipCriteria, type VipCriteria } from '@/hooks/useAdminTools';
import { Sparkles, RotateCcw } from 'lucide-react';

const FIELDS: { key: keyof VipCriteria; label: string; hint: string }[] = [
  { key: 'min_merchant_visits', label: 'Minimum merchant visits', hint: 'Distinct merchants the member has bought from.' },
  { key: 'min_purchases', label: 'Minimum purchases', hint: 'Completed redemptions.' },
  { key: 'min_reviews', label: 'Minimum reviews', hint: 'Reviews they have submitted.' },
  { key: 'min_engagement_score', label: 'Minimum engagement score', hint: 'Weighted score across visits, purchases, reviews, views and streaks.' },
];

export function AdminLoyaltyPage() {
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
        <h1 className="text-2xl font-bold text-text-primary">Loyalty & VIP</h1>
        <p className="text-sm text-text-secondary mt-1">
          Members qualify for VIP automatically when they meet every requirement below. Set a value to
          <strong className="text-text-primary"> 0</strong> to disable that requirement entirely.
        </p>
      </div>

      <Card>
        <CardHeader
          title="VIP qualification criteria"
          subtitle="Applies to every member the next time their status is evaluated"
        />

        {isLoading || !form ? (
          <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIELDS.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  type="number"
                  value={form[field.key]}
                  onChange={(e) => set(field.key, Number(e.target.value))}
                  hint={field.hint}
                />
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <Button onClick={() => updateCriteria.mutate(form)} loading={updateCriteria.isPending}>
                <Sparkles className="h-4 w-4 mr-1.5" /> Save criteria
              </Button>
              {data?.defaults && (
                <Button variant="ghost" onClick={() => setForm(data.defaults)}>
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Reset to defaults
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
