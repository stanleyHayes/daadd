import React, { useState } from 'react';
import {
  CheckCircle2,
  Mail,
  ShieldCheck,
  CreditCard,
  Clock,
  XCircle,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/auth.store';
import {
  useRequestEmailVerification,
  useConfirmEmailVerification,
  useSetupBilling,
} from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/**
 * Advertiser onboarding checklist. Renders only for advertiser accounts that
 * have not yet cleared the run-ads gate (email verified + admin approved +
 * billing ready). Mirrors the backend gate in utils/advertiser-gate.ts.
 */
export function AdvertiserOnboarding({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');

  const requestVerify = useRequestEmailVerification();
  const confirmVerify = useConfirmEmailVerification();
  const setupBilling = useSetupBilling();

  if (!user || user.role !== 'advertiser' || user.can_run_ads) return null;

  const emailDone = !!user.email_verified;
  const approval = user.advertiser_approval ?? 'pending';
  const approvalDone = approval === 'approved';
  const billingDone = !!user.billing_ready;

  const handleRequest = async () => {
    try {
      const res = await requestVerify.mutateAsync();
      setCodeSent(true);
      if (res?.dev_code) {
        setCode(res.dev_code);
        toast.success(`Dev code: ${res.dev_code}`, { duration: 8000 });
      } else {
        toast.success('Verification code sent to your email');
      }
    } catch {
      toast.error('Failed to send code');
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmVerify.mutateAsync(code.trim());
      toast.success('Email verified');
      setCodeSent(false);
      setCode('');
    } catch {
      toast.error('Invalid or expired code');
    }
  };

  const handleBilling = async () => {
    try {
      await setupBilling.mutateAsync();
      toast.success('Billing set up');
    } catch {
      toast.error('Failed to set up billing');
    }
  };

  return (
    <Card
      className={cn(
        'border-secondary-200 bg-secondary-50/40 dark:border-secondary-900/40 dark:bg-secondary-900/10',
        className
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-300">
          <Rocket className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">Finish setting up to run ads</h3>
          <p className="text-sm text-text-secondary">
            Complete these steps before you can launch campaigns.
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        <Step
          done={emailDone}
          icon={<Mail className="h-4 w-4" />}
          title="Verify your email"
          description={emailDone ? 'Your email is verified.' : `Confirm ${user.email}.`}
        >
          {!emailDone &&
            (!codeSent ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequest}
                loading={requestVerify.isPending}
              >
                Send code
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit code"
                  className="w-32"
                />
                <Button size="sm" onClick={handleConfirm} loading={confirmVerify.isPending}>
                  Confirm
                </Button>
              </div>
            ))}
        </Step>

        <Step
          done={approvalDone}
          variant={approval === 'rejected' ? 'error' : approval === 'pending' ? 'pending' : undefined}
          icon={
            approval === 'rejected' ? <XCircle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />
          }
          title="Admin approval"
          description={
            approvalDone
              ? 'Your advertiser account is approved.'
              : approval === 'rejected'
                ? 'Your application was rejected. Please contact support.'
                : 'An admin is reviewing your account — no action needed from you.'
          }
        >
          {!approvalDone && approval === 'pending' && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" /> Pending review
            </span>
          )}
        </Step>

        <Step
          done={billingDone}
          icon={<CreditCard className="h-4 w-4" />}
          title="Set up billing"
          description={
            billingDone ? 'Billing is set up.' : 'Add a payment method to fund your campaigns.'
          }
        >
          {!billingDone && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBilling}
              loading={setupBilling.isPending}
            >
              Set up billing
            </Button>
          )}
        </Step>
      </ol>
    </Card>
  );
}

function Step({
  done,
  variant,
  icon,
  title,
  description,
  children,
}: {
  done: boolean;
  variant?: 'pending' | 'error';
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const circle = done
    ? 'bg-accent-500 text-white'
    : variant === 'error'
      ? 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400'
      : variant === 'pending'
        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-bg-secondary text-text-muted dark:bg-slate-700';

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border-color bg-card-bg p-3">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', circle)}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
      {children && <div className="shrink-0 self-center">{children}</div>}
    </li>
  );
}
