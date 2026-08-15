import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useMyVerification,
  useSubmitVerification,
  ID_TYPES,
  type IdType,
  type VerificationStatus,
} from '@/hooks/useMerchantVerification';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Clock, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLE: Record<VerificationStatus, { tone: string; icon: typeof ShieldCheck }> = {
  verified: {
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-300',
    icon: ShieldCheck,
  },
  pending: {
    tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300',
    icon: Clock,
  },
  restricted: {
    tone: 'border-danger-200 bg-danger-50 text-danger-800 dark:border-danger-900/40 dark:bg-danger-900/10 dark:text-danger-300',
    icon: ShieldAlert,
  },
  suspended: {
    tone: 'border-danger-200 bg-danger-50 text-danger-800 dark:border-danger-900/40 dark:bg-danger-900/10 dark:text-danger-300',
    icon: Ban,
  },
};

type FormState = {
  business_name: string;
  business_registration_number: string;
  business_city: string;
  business_address: string;
  contact_phone: string;
  owner_name: string;
  owner_id_type: IdType;
  owner_id_number: string;
  settlement_provider: string;
  settlement_account: string;
};

/**
 * A merchant's verification status and KYC form. Shown at the top of the merchant
 * dashboard because an unverified merchant cannot accept redemptions — the whole
 * dashboard is inert until this clears.
 */
export function MerchantVerificationPanel() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyVerification();
  const submit = useSubmitVerification();

  const record = data?.verification ?? null;
  const gate = data?.gate;

  const [form, setForm] = useState<FormState | null>(null);

  // Seed the form from the saved record once it arrives. Sensitive numbers are
  // never returned (only last-4), so those inputs start blank and the operator
  // re-enters them to change them.
  const initial = useMemo<FormState>(
    () => ({
      business_name: record?.business_name ?? '',
      business_registration_number: record?.business_registration_number ?? '',
      business_city: record?.business_city ?? '',
      business_address: record?.business_address ?? '',
      contact_phone: record?.contact_phone ?? '',
      owner_name: record?.owner_name ?? '',
      owner_id_type: (record?.owner_id_type as IdType) ?? 'ghana_card',
      owner_id_number: '',
      settlement_provider: record?.settlement_provider ?? '',
      settlement_account: '',
    }),
    [record]
  );

  const state = form ?? initial;
  const set = (patch: Partial<FormState>) => setForm({ ...state, ...patch });

  const canSubmit =
    state.business_name.trim() &&
    state.business_registration_number.trim() &&
    state.owner_name.trim();

  const onSubmit = async () => {
    try {
      await submit.mutateAsync(state);
      setForm(null);
      toast.success(t('dashboard.verification.submitted'));
    } catch {
      toast.error(t('dashboard.verification.submitFailed'));
    }
  };

  if (isLoading) return <Skeleton variant="card" className="h-40" />;

  const status = gate?.status ?? 'pending';
  const style = STATUS_STYLE[status];
  const StatusIcon = style.icon;
  const maskedId = record?.owner_id_last4;
  const maskedAccount = record?.settlement_account_last4;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={cn('flex items-start gap-3 rounded-2xl border p-4', style.tone)}>
        <StatusIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">{t(`dashboard.verification.status.${status}`)}</p>
          <p className="text-sm opacity-90">
            {gate?.can_transact
              ? t('dashboard.verification.canTransact')
              : gate?.reason || t('dashboard.verification.status.pending')}
          </p>
          {record?.review_notes ? (
            <p className="mt-1 text-sm opacity-90">
              <span className="font-medium">{t('dashboard.verification.reviewNote')}:</span>{' '}
              {record.review_notes}
            </p>
          ) : null}
        </div>
      </div>

      {/* KYC form */}
      <Card>
        <CardHeader
          title={t('dashboard.verification.formTitle')}
          subtitle={t('dashboard.verification.formSubtitle')}
        />
        {status === 'verified' ? (
          <p className="mb-4 text-sm text-text-secondary">{t('dashboard.verification.reReviewWarning')}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('dashboard.verification.businessName')}
            value={state.business_name}
            onChange={(e) => set({ business_name: e.target.value })}
          />
          <Input
            label={t('dashboard.verification.registrationNumber')}
            value={state.business_registration_number}
            onChange={(e) => set({ business_registration_number: e.target.value })}
          />
          <Input
            label={t('dashboard.verification.city')}
            value={state.business_city}
            onChange={(e) => set({ business_city: e.target.value })}
          />
          <Input
            label={t('dashboard.verification.phone')}
            value={state.contact_phone}
            onChange={(e) => set({ contact_phone: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label={t('dashboard.verification.address')}
              value={state.business_address}
              onChange={(e) => set({ business_address: e.target.value })}
            />
          </div>

          <Input
            label={t('dashboard.verification.ownerName')}
            value={state.owner_name}
            onChange={(e) => set({ owner_name: e.target.value })}
          />
          <Select
            label={t('dashboard.verification.idType')}
            value={state.owner_id_type}
            onChange={(v) => set({ owner_id_type: v as IdType })}
            options={ID_TYPES.map((id) => ({
              value: id,
              label: t(`dashboard.verification.idTypes.${id}`),
            }))}
          />
          <Input
            label={t('dashboard.verification.idNumber')}
            value={state.owner_id_number}
            onChange={(e) => set({ owner_id_number: e.target.value })}
            hint={maskedId ? t('dashboard.verification.currentEnding', { last4: maskedId }) : undefined}
          />
          <Input
            label={t('dashboard.verification.settlementProvider')}
            value={state.settlement_provider}
            onChange={(e) => set({ settlement_provider: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label={t('dashboard.verification.settlementAccount')}
              value={state.settlement_account}
              onChange={(e) => set({ settlement_account: e.target.value })}
              hint={
                maskedAccount
                  ? t('dashboard.verification.currentEnding', { last4: maskedAccount })
                  : t('dashboard.verification.settlementHint')
              }
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={onSubmit} loading={submit.isPending} disabled={!canSubmit}>
            {t('dashboard.verification.submit')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
