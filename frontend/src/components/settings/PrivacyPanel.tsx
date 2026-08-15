import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useConsents,
  useUpdateConsent,
  useDataExport,
  useDeleteMyData,
  CONSENT_PURPOSES,
  type ConsentPurpose,
} from '@/hooks/usePrivacy';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { Download, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * The user's data-protection rights in one place: what they've agreed to, a copy
 * of their data, and account erasure. Consent toggles write immediately — a
 * consent decision should never sit unsaved behind a Save button.
 */
export function PrivacyPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const { data: consents, isLoading } = useConsents();
  const updateConsent = useUpdateConsent();
  const exportData = useDataExport();
  const deleteData = useDeleteMyData();

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const toggle = async (purpose: ConsentPurpose, granted: boolean) => {
    try {
      await updateConsent.mutateAsync({ purpose, granted });
    } catch {
      toast.error(t('dashboard.privacy.saveFailed'));
    }
  };

  const runExport = async () => {
    try {
      const data = await exportData.mutateAsync();
      // Hand the user a file rather than dumping JSON on screen.
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daadd-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('dashboard.privacy.exportFailed'));
    }
  };

  const runDelete = async () => {
    try {
      await deleteData.mutateAsync();
      toast.success(t('dashboard.privacy.deleted'));
      logout();
      navigate('/');
    } catch {
      toast.error(t('dashboard.privacy.deleteFailed'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Consent */}
      <Card>
        <CardHeader
          title={t('dashboard.privacy.consentTitle')}
          subtitle={t('dashboard.privacy.consentSubtitle')}
        />
        {isLoading || !consents ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border-color dark:divide-slate-800">
            {CONSENT_PURPOSES.map((purpose) => (
              <li key={purpose} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {t(`dashboard.privacy.purposes.${purpose}.label`)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {t(`dashboard.privacy.purposes.${purpose}.desc`)}
                  </p>
                </div>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={consents[purpose]}
                    onChange={(e) => toggle(purpose, e.target.checked)}
                  />
                  <div className="h-6 w-11 rounded-full bg-bg-tertiary transition-colors peer-checked:bg-primary-600 dark:bg-slate-700 peer-checked:dark:bg-primary-600" />
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                </label>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Your data */}
      <Card>
        <CardHeader
          title={t('dashboard.privacy.dataTitle')}
          subtitle={t('dashboard.privacy.dataSubtitle')}
        />
        <Button variant="outline" onClick={runExport} loading={exportData.isPending}>
          <Download className="mr-1.5 h-4 w-4" /> {t('dashboard.privacy.export')}
        </Button>
      </Card>

      {/* Erasure */}
      <Card className="border-danger-200 dark:border-danger-900/40">
        <CardHeader
          title={t('dashboard.privacy.deleteTitle')}
          subtitle={t('dashboard.privacy.deleteSubtitle')}
        />
        {!confirmingDelete ? (
          <Button
            variant="ghost"
            className="text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
            onClick={() => setConfirmingDelete(true)}
          >
            <ShieldAlert className="mr-1.5 h-4 w-4" /> {t('dashboard.privacy.delete')}
          </Button>
        ) : (
          <div className="rounded-xl border border-danger-200 bg-danger-50/50 p-4 dark:border-danger-900/40 dark:bg-danger-900/10">
            <p className="mb-3 text-sm text-text-primary">{t('dashboard.privacy.deleteConfirm')}</p>
            <div className="flex gap-2">
              <Button
                className="bg-danger-600 hover:bg-danger-700"
                onClick={runDelete}
                loading={deleteData.isPending}
              >
                {t('dashboard.privacy.deleteConfirmYes')}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                {t('dashboard.common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
