import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useOutlets, useCreateOutlet, useUpdateOutlet, useDeleteOutlet, type OutletInput } from '@/hooks/useOutlets';
import type { Outlet } from '@/types';
import { MapPin, Plus, Trash2, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY: OutletInput = { name: '', address: '', city: '', phone: '', opening_hours: '' };

export function OutletsPage() {
  const { t } = useTranslation();
  const { data: outlets = [], isLoading } = useOutlets();
  const createOutlet = useCreateOutlet();
  const updateOutlet = useUpdateOutlet();
  const deleteOutlet = useDeleteOutlet();

  const [form, setForm] = useState<OutletInput>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);

  const set = (key: keyof OutletInput, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const startEdit = (o: Outlet) => {
    setEditingId(o.id);
    setForm({
      name: o.name,
      address: o.address,
      city: o.city,
      phone: o.phone,
      opening_hours: o.opening_hours,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      toast.error(t('dashboard.outlets.nameRequired'));
      return;
    }
    try {
      if (editingId) {
        await updateOutlet.mutateAsync({ id: editingId, ...form });
        toast.success(t('dashboard.outlets.updated'));
      } else {
        await createOutlet.mutateAsync(form);
        toast.success(t('dashboard.outlets.added'));
      }
      cancelEdit();
    } catch {
      toast.error(t('dashboard.outlets.saveFailed'));
    }
  };

  const handleDelete = async (o: Outlet) => {
    try {
      await deleteOutlet.mutateAsync(o.id);
      toast.success(t('dashboard.outlets.removed'));
      if (editingId === o.id) cancelEdit();
    } catch {
      toast.error(t('dashboard.outlets.removeFailed'));
    }
  };

  const busy = createOutlet.isPending || updateOutlet.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.outlets.title')}</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your physical locations. Customers pick the branch they're visiting when they redeem, and
          these appear on your adverts.
        </p>
      </div>

      <Card>
        <CardHeader title={editingId ? 'Edit outlet' : 'Add an outlet'} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('dashboard.outlets.name')} placeholder={t('dashboard.outlets.namePlaceholder')} value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
          <Input label={t('dashboard.outlets.city')} placeholder={t('dashboard.outlets.cityPlaceholder')} value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
          <Input label={t('dashboard.outlets.address')} placeholder={t('dashboard.outlets.addressPlaceholder')} value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
          <Input label={t('dashboard.outlets.phone')} type="tel" placeholder={t('dashboard.outlets.phonePlaceholder')} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          <Input
            label={t('dashboard.outlets.hours')}
            placeholder={t('dashboard.outlets.hoursPlaceholder')}
            value={form.opening_hours || ''}
            onChange={(e) => set('opening_hours', e.target.value)}
            className="sm:col-span-2"
          />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button onClick={handleSubmit} loading={busy}>
            {editingId ? <Pencil className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
            {editingId ? 'Save changes' : 'Add outlet'}
          </Button>
          {editingId && (
            <Button variant="ghost" onClick={cancelEdit}>
              <X className="h-4 w-4 mr-1.5" /> {t('dashboard.common.cancel')}
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={t('dashboard.outlets.yourOutlets')} subtitle={`${outlets.length} location${outlets.length === 1 ? '' : 's'}`} />
        {isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : outlets.length === 0 ? (
          <EmptyState
            variant="plain"
            icon={<MapPin />}
            title={t('dashboard.outlets.emptyTitle')}
            description={t('dashboard.outlets.emptyDesc')}
          />
        ) : (
          <ul className="divide-y divide-border-color dark:divide-slate-800">
            {outlets.map((o) => (
              <li key={o.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {o.name}
                    {!o.is_active && <span className="ml-2 text-xs font-normal text-text-muted">(inactive)</span>}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {[o.address, o.city].filter(Boolean).join(', ') || 'No address'}
                  </p>
                  {(o.phone || o.opening_hours) && (
                    <p className="text-xs text-text-muted truncate">
                      {[o.phone, o.opening_hours].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => startEdit(o)}
                    className="rounded-lg p-2 text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                    aria-label={`Edit ${o.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(o)}
                    className="rounded-lg p-2 text-text-secondary hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20"
                    aria-label={`Delete ${o.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
