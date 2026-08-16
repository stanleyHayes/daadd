import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useMyProducts,
  useSaveProduct,
  useDeleteProduct,
  formatMinor,
  type Product,
} from '@/hooks/useCommerce';
import { Package, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

type FormState = { id?: string; name: string; description: string; category: string; price_ghs: string; stock: string };

const EMPTY: FormState = { name: '', description: '', category: '', price_ghs: '', stock: '' };

export function MerchantProductsPage() {
  const { t } = useTranslation();
  const { data: products, isLoading } = useMyProducts();
  const save = useSaveProduct();
  const del = useDeleteProduct();
  const [form, setForm] = useState<FormState | null>(null);

  const edit = (p: Product) =>
    setForm({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price_ghs: (p.price_minor / 100).toFixed(2),
      stock: p.stock != null ? String(p.stock) : '',
    });

  const submit = async () => {
    if (!form) return;
    const price_minor = Math.round(Number(form.price_ghs) * 100);
    if (!form.name.trim() || !Number.isFinite(price_minor) || price_minor < 0) {
      toast.error(t('dashboard.products.invalid'));
      return;
    }
    await save.mutateAsync({
      id: form.id,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price_minor,
      stock: form.stock === '' ? undefined : Math.max(0, Math.floor(Number(form.stock))),
    });
    setForm(null);
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageHeader title={t('dashboard.products.title')} subtitle={t('dashboard.products.subtitle')} />
          {!form && (
            <Button onClick={() => setForm({ ...EMPTY })}>
              <Plus className="h-4 w-4" /> {t('dashboard.products.add')}
            </Button>
          )}
        </div>

        {form && (
          <Card>
            <CardHeader title={form.id ? t('dashboard.products.editTitle') : t('dashboard.products.newTitle')} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label={t('dashboard.products.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label={t('dashboard.products.category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <Input
                label={t('dashboard.products.price')}
                type="number"
                step="0.01"
                value={form.price_ghs}
                onChange={(e) => setForm({ ...form, price_ghs: e.target.value })}
                hint={t('dashboard.products.priceHint')}
              />
              <Input label={t('dashboard.products.stock')} type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} hint={t('dashboard.products.stockHint')} />
              <div className="sm:col-span-2">
                <Input label={t('dashboard.products.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button onClick={submit} loading={save.isPending}>{t('dashboard.common.save')}</Button>
              <Button variant="ghost" onClick={() => setForm(null)}>{t('dashboard.common.cancel')}</Button>
            </div>
          </Card>
        )}

        <Card shape="soft">
          {isLoading ? (
            <div className="py-12 text-center text-text-muted">{t('dashboard.common.loading')}</div>
          ) : !products || products.length === 0 ? (
            <EmptyState variant="plain" icon={<Package />} title={t('dashboard.products.emptyTitle')} description={t('dashboard.products.emptyDesc')} />
          ) : (
            <ul className="divide-y divide-border-color dark:divide-slate-800">
              {products.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text-primary">
                      {p.name}
                      {!p.is_active && <span className="ml-2 text-xs text-text-muted">({t('dashboard.products.inactive')})</span>}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {formatMinor(p.price_minor, p.currency)}
                      {p.category ? ` · ${p.category}` : ''}
                      {p.stock != null ? ` · ${t('dashboard.products.inStock', { n: p.stock })}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => edit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-danger-600" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
