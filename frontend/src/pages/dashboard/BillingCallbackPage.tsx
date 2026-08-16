import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useVerifyPayment } from '@/hooks/useOnboarding';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

/**
 * Where Paystack sends the browser after checkout. We reconcile the payment by
 * its reference (idempotent server-side — the webhook may have already done it)
 * and show the outcome.
 */
export function BillingCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reference = params.get('reference');
  const verify = useVerifyPayment();
  const [status, setStatus] = useState<'checking' | 'paid' | 'failed'>('checking');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!reference) {
      setStatus('failed');
      return;
    }
    verify
      .mutateAsync(reference)
      .then((r) => setStatus(r.status === 'paid' ? 'paid' : 'failed'))
      .catch(() => setStatus('failed'));
  }, [reference, verify]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-md py-16">
        <Card className="text-center">
          {status === 'checking' && (
            <div className="py-8">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-600" />
              <p className="mt-4 text-text-secondary">{t('dashboard.billing.checking')}</p>
            </div>
          )}
          {status === 'paid' && (
            <div className="py-8">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h1 className="mt-4 text-xl font-bold text-text-primary">{t('dashboard.billing.paidTitle')}</h1>
              <p className="mt-1 text-text-secondary">{t('dashboard.billing.paidBody')}</p>
              <Button className="mt-6" onClick={() => navigate('/dashboard')}>
                {t('dashboard.billing.continue')}
              </Button>
            </div>
          )}
          {status === 'failed' && (
            <div className="py-8">
              <XCircle className="mx-auto h-12 w-12 text-danger-500" />
              <h1 className="mt-4 text-xl font-bold text-text-primary">{t('dashboard.billing.failedTitle')}</h1>
              <p className="mt-1 text-text-secondary">{t('dashboard.billing.failedBody')}</p>
              <Button variant="outline" className="mt-6" onClick={() => navigate('/dashboard')}>
                {t('dashboard.billing.back')}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
