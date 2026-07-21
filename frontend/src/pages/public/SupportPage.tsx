import { useState, type ComponentType } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageTransition } from '@/components/ui/PageTransition';
import { useAuthStore } from '@/stores/auth.store';
import { useFaq, useSubmitTicket, type SupportCategory } from '@/hooks/useSupport';
import { cn } from '@/lib/utils';
import {
  LifeBuoy,
  ChevronDown,
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
  Megaphone,
  Store,
  CreditCard,
} from 'lucide-react';

const DESKS: {
  key: SupportCategory;
  label: string;
  blurb: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { key: 'general', label: 'Contact Support', blurb: 'General questions about your account.', icon: MessageSquare },
  { key: 'problem', label: 'Report a Problem', blurb: 'Something is broken or a reward looks wrong.', icon: AlertTriangle },
  { key: 'fraud', label: 'Report Fraud or Abuse', blurb: 'Suspicious merchants, scams or misuse.', icon: ShieldAlert },
  { key: 'campaign', label: 'Campaign Assistance', blurb: 'Help running or optimising a campaign.', icon: Megaphone },
  { key: 'merchant', label: 'Merchant Assistance', blurb: 'Redemptions, outlets and QR scanning.', icon: Store },
  { key: 'billing', label: 'Billing', blurb: 'Budgets, top-ups and invoices.', icon: CreditCard },
];

export function SupportPage() {
  const user = useAuthStore((s) => s.user);
  const { data: faq = [] } = useFaq();
  const submitTicket = useSubmitTicket();

  const [category, setCategory] = useState<SupportCategory>('general');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const activeDesk = DESKS.find((d) => d.key === category)!;

  const handleSubmit = async () => {
    if (!email.trim() || !subject.trim() || !message.trim()) return;
    await submitTicket.mutateAsync({ name, email, category, subject, message });
    setSubject('');
    setMessage('');
  };

  const canSubmit = !!email.trim() && !!subject.trim() && !!message.trim();

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-3xl font-bold text-text-primary">Support Centre</h1>
          <p className="mt-2 text-text-secondary">
            Find a quick answer below, or send the right team a message.
          </p>
        </div>

        {/* FAQ */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Frequently asked questions</h2>
          <div className="divide-y divide-border-color dark:divide-slate-800">
            {faq.map((item, i) => (
              <div key={item.q} className="py-3">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="text-sm font-medium text-text-primary">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-text-muted transition-transform',
                      openFaq === i && 'rotate-180'
                    )}
                  />
                </button>
                {openFaq === i && (
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Desks */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Who can help?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DESKS.map((desk) => {
              const Icon = desk.icon;
              const isActive = category === desk.key;
              return (
                <button
                  key={desk.key}
                  onClick={() => setCategory(desk.key)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                    isActive
                      ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                      : 'border-border-color bg-card-bg hover:bg-bg-secondary'
                  )}
                >
                  <Icon
                    className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary-600' : 'text-text-muted')}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{desk.label}</p>
                    <p className="text-xs text-text-secondary">{desk.blurb}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary">{activeDesk.label}</h2>
          <p className="mt-1 mb-4 text-sm text-text-secondary">{activeDesk.blurb}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama Mensah" />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              hint="We'll reply here."
            />
          </div>
          <div className="mt-4">
            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly, what's this about?"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-text-secondary mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={
                category === 'problem' || category === 'fraud'
                  ? 'Include the receipt number, merchant and date if you have them.'
                  : 'Tell us a bit more…'
              }
              className="block w-full rounded-md border border-border-color bg-card-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <Button
            onClick={handleSubmit}
            loading={submitTicket.isPending}
            disabled={!canSubmit}
            className="mt-4"
          >
            Send to {activeDesk.label}
          </Button>
        </Card>
      </div>
    </PageTransition>
  );
}
