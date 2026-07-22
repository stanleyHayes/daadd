import { useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
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

// Labels and blurbs live in the locale files, keyed by `key`.
const DESKS: {
  key: SupportCategory;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { key: 'general', icon: MessageSquare },
  { key: 'problem', icon: AlertTriangle },
  { key: 'fraud', icon: ShieldAlert },
  { key: 'campaign', icon: Megaphone },
  { key: 'merchant', icon: Store },
  { key: 'billing', icon: CreditCard },
];

export function SupportPage() {
  const { t } = useTranslation();
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
  const deskLabel = (key: SupportCategory) => t(`support.desks.${key}.label`);
  const deskBlurb = (key: SupportCategory) => t(`support.desks.${key}.blurb`);

  const handleSubmit = async () => {
    if (!email.trim() || !subject.trim() || !message.trim()) return;
    await submitTicket.mutateAsync({ name, email, category, subject, message });
    setSubject('');
    setMessage('');
  };

  const canSubmit = !!email.trim() && !!subject.trim() && !!message.trim();

  return (
    <PageTransition>
      <div className="bg-bg-secondary pb-20 dark:bg-slate-950">
        <section className="relative overflow-hidden bg-primary-700 text-white">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-400 text-primary-900 shadow-lg">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-6xl">{t('support.title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/65">{t('support.subtitle')}</p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 space-y-8">

        {/* FAQ */}
        <Card shape="soft" className="shadow-[0_20px_60px_rgba(7,20,49,0.09)]">
          <h2 className="text-lg font-semibold text-text-primary mb-4">{t('support.faqTitle')}</h2>
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
          <h2 className="text-lg font-semibold text-text-primary mb-3">{t('support.desksTitle')}</h2>
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
                    <p className="text-sm font-semibold text-text-primary">{deskLabel(desk.key)}</p>
                    <p className="text-xs text-text-secondary">{deskBlurb(desk.key)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <Card shape="soft" className="shadow-[0_20px_60px_rgba(7,20,49,0.07)]">
          <h2 className="text-lg font-semibold text-text-primary">{deskLabel(activeDesk.key)}</h2>
          <p className="mt-1 mb-4 text-sm text-text-secondary">{deskBlurb(activeDesk.key)}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('support.nameLabel')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('support.namePlaceholder')} />
            <Input
              label={t('support.emailLabel')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('support.emailPlaceholder')}
              hint={t('support.emailHint')}
            />
          </div>
          <div className="mt-4">
            <Input
              label={t('support.subjectLabel')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('support.subjectPlaceholder')}
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('support.messageLabel')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={
                category === 'problem' || category === 'fraud'
                  ? t('support.messagePlaceholderIncident')
                  : t('support.messagePlaceholder')
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
            {t('support.submit', { desk: deskLabel(activeDesk.key) })}
          </Button>
        </Card>
        </div>
      </div>
    </PageTransition>
  );
}
