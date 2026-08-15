import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useReferral } from '@/hooks/useReferral';
import { Copy, Check, Gift, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * "Refer a friend": the user's shareable code + link and how their invitees are
 * doing. A referrer earns tokens only once an invitee makes their first
 * redemption — surfaced here so the incentive is clear.
 */
export function ReferralPanel() {
  const { t } = useTranslation();
  const { data, isLoading } = useReferral();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const copy = async (value: string, which: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error(t('dashboard.referral.copyFailed'));
    }
  };

  const share = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'DAADD', text: t('dashboard.referral.shareText'), url: data.share_url });
      } catch {
        /* user dismissed the share sheet — not an error */
      }
    } else {
      copy(data.share_url, 'link');
    }
  };

  if (isLoading || !data) return <Skeleton variant="card" className="h-64" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('dashboard.referral.title')}
          subtitle={t('dashboard.referral.subtitle', { tokens: data.bonus_tokens })}
        />

        {/* The code */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium text-text-secondary">{t('dashboard.referral.yourCode')}</p>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border-color bg-bg-secondary px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <span className="truncate font-mono text-xl font-bold tracking-widest text-text-primary">{data.code}</span>
              <button
                onClick={() => copy(data.code, 'code')}
                className="shrink-0 text-text-secondary hover:text-primary-600"
                aria-label={t('dashboard.referral.copyCode')}
              >
                {copied === 'code' ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <Button onClick={share}>
            <Share2 className="mr-1.5 h-4 w-4" /> {t('dashboard.referral.share')}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Gift className="h-5 w-5" />
          </div>
          <p className="text-2xl font-black text-text-primary">{data.activated_count}</p>
          <p className="text-xs text-text-secondary">{t('dashboard.referral.activated')}</p>
        </Card>
        <Card className="text-center">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-bg-secondary text-text-muted dark:bg-slate-700">
            <Gift className="h-5 w-5" />
          </div>
          <p className="text-2xl font-black text-text-primary">{data.pending_count}</p>
          <p className="text-xs text-text-secondary">{t('dashboard.referral.pending')}</p>
        </Card>
      </div>
    </div>
  );
}
