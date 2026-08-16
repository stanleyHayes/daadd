import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  useMyVerification,
  useSettlementBanks,
  useResolveAccount,
  useConnectSettlement,
} from '@/hooks/useMerchantVerification';
import { Banknote, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Merchant self-service settlement: connect a bank / mobile-money account. The
 * PSP verifies the account and creates a subaccount, so a merchant's share of an
 * order settles to them directly — DAADD never holds the merchant's funds.
 */
export function MerchantSettlementPanel() {
  const { t } = useTranslation();
  const { data } = useMyVerification();
  const record = data?.verification ?? null;
  const connected = record?.settlement_connected === true;

  const banksQuery = useSettlementBanks(!connected);
  const resolve = useResolveAccount();
  const connect = useConnectSettlement();

  const [bankCode, setBankCode] = useState('');
  const [account, setAccount] = useState('');
  const [accountName, setAccountName] = useState<string | null>(null);

  const banks = banksQuery.data ?? [];

  const verify = async () => {
    setAccountName(null);
    if (!bankCode || !account.trim()) {
      toast.error(t('dashboard.settlement.fillFields'));
      return;
    }
    try {
      const r = await resolve.mutateAsync({ bank_code: bankCode, account_number: account.trim() });
      setAccountName(r.account_name);
    } catch {
      toast.error(t('dashboard.settlement.verifyFailed'));
    }
  };

  const doConnect = async () => {
    try {
      const provider = banks.find((b) => b.code === bankCode)?.name;
      await connect.mutateAsync({ bank_code: bankCode, account_number: account.trim(), provider });
      toast.success(t('dashboard.settlement.connected'));
      setAccountName(null);
      setAccount('');
    } catch {
      toast.error(t('dashboard.settlement.connectFailed'));
    }
  };

  return (
    <Card>
      <CardHeader
        title={t('dashboard.settlement.title')}
        subtitle={t('dashboard.settlement.subtitle')}
      />

      {connected ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">{t('dashboard.settlement.connectedTitle')}</p>
            <p className="text-sm text-emerald-800/90 dark:text-emerald-300/90">
              {record?.settlement_account_name || record?.settlement_provider}
              {record?.settlement_account_last4 ? ` · •••• ${record.settlement_account_last4}` : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={t('dashboard.settlement.bank')}
              value={bankCode}
              onChange={(v) => { setBankCode(v); setAccountName(null); }}
              placeholder={banksQuery.isLoading ? t('dashboard.common.loading') : t('dashboard.settlement.selectBank')}
              options={banks.map((b) => ({ value: b.code, label: b.name }))}
            />
            <Input
              label={t('dashboard.settlement.accountNumber')}
              value={account}
              onChange={(e) => { setAccount(e.target.value); setAccountName(null); }}
            />
          </div>

          {accountName ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-900/10">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
                {accountName}
              </p>
              <Button size="sm" onClick={doConnect} loading={connect.isPending}>
                <Banknote className="h-4 w-4" /> {t('dashboard.settlement.connect')}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={verify} loading={resolve.isPending}>
              {t('dashboard.settlement.verify')}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
