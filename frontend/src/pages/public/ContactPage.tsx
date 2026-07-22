import React, { useState } from 'react';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSubmitTicket } from '@/hooks/useSupport';
import { useSiteContact } from '@/hooks/useSiteContent';

// Channel labels live in the locale files; only addresses, phone numbers and
// styling stay here. Channels without a literal `value` render a translated one.
/**
 * Channel definitions. The values come from the CMS at render time — a channel
 * whose value is blank is dropped rather than shown with a placeholder, so an
 * unconfigured install never prints a phone number nobody answers.
 */
const CHANNELS = [
  { icon: Mail, key: 'email', field: 'email', href: (v: string) => `mailto:${v}`,
    color: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300' },
  { icon: Phone, key: 'phone', field: 'phone', href: (v: string) => `tel:${v.replace(/\s/g, '')}`,
    color: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' },
  { icon: MapPin, key: 'visit', field: 'address_line', href: () => '#',
    color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' },
] as const;

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4'] as const;

const TOPIC_KEYS = ['general', 'sales', 'support', 'partners', 'feedback'] as const;

export function ContactPage() {
  const { t } = useTranslation();
  const topicOptions = TOPIC_KEYS.map((k) => ({ value: k, label: t(`contact.topics.${k}`) }));
  const submitTicket = useSubmitTicket();
  const { data: siteContact } = useSiteContact();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Only channels the admin has actually filled in.
  const channels = CHANNELS.map((def) => ({
    def,
    value: (siteContact?.[def.field as keyof typeof siteContact] as string) || '',
  })).filter((c) => c.value);

  const hours = [
    { label: 'weekdays', value: siteContact?.hours_weekdays || '' },
    { label: 'saturday', value: siteContact?.hours_saturday || '' },
    { label: 'sunday', value: siteContact?.hours_sunday || '' },
  ].filter((h) => h.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitTicket.mutateAsync({
        name: form.name,
        email: form.email,
        // The public topics map onto the support desks the backend already has.
        category: form.topic === 'sales' || form.topic === 'partners' ? 'general' : 'general',
        subject: form.topic
          ? t(`contact.topics.${form.topic}`)
          : t('contact.topics.general'),
        message: form.message,
      });
      toast.success(t('contact.sentToast'));
      setSent(true);
    } catch {
      toast.error(t('contact.sendFailed'));
    }
  };

  return (
    <PageTransition>
      <div className="bg-bg-primary dark:bg-slate-950">
        {/* Hero */}
        <section className="bg-primary-700 text-white">
          <WatermarkBanner icon={<Mail />} />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
                {t('contact.title')}
              </h1>
              <p className="text-lg text-primary-100 leading-relaxed">
                {t('contact.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Contact channels — whatever the CMS has published, nothing more */}
        {channels.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map(({ def, value }) => (
                <a
                  key={def.key}
                  href={def.href(value)}
                  className="group flex flex-col rounded-2xl border border-border-color bg-card-bg p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl', def.color)}>
                    <def.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-1 font-semibold text-text-primary transition-colors group-hover:text-secondary-600">
                    {t(`contact.channels.${def.key}`)}
                  </h3>
                  <p className="mt-auto text-sm text-text-muted">{value}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Form + map/availability */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card padding={false} shape="soft" className="overflow-hidden border-0 shadow-lg">
                <div className="bg-primary-700 px-6 sm:px-8 py-6">
                  <h2 className="text-xl font-bold text-white">{t('contact.formTitle')}</h2>
                  <p className="text-primary-100 text-sm mt-1">{t('contact.formSubtitle')}</p>
                </div>
                <div className="p-6 sm:p-8">
                  {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input
                          label={t('contact.nameLabel')}
                          placeholder={t('contact.namePlaceholder')}
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                        <Input
                          label={t('contact.emailLabel')}
                          type="email"
                          placeholder={t('contact.emailPlaceholder')}
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                        />
                      </div>
                      <Select
                        label={t('contact.topicLabel')}
                        placeholder={t('contact.topicPlaceholder')}
                        options={topicOptions}
                        value={form.topic}
                        onChange={(value) => setForm({ ...form, topic: value })}
                        fullWidth
                      />
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('contact.messageLabel')}</label>
                        <textarea
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          rows={5}
                          required
                          placeholder={t('contact.messagePlaceholder')}
                          className="block w-full rounded-lg border border-border-color dark:border-slate-600 bg-bg-primary dark:bg-slate-800 px-3 py-2.5 text-sm dark:text-white placeholder:text-text-muted focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 focus:outline-none resize-y"
                        />
                      </div>
                      <Button type="submit" fullWidth loading={submitTicket.isPending} icon={<Send className="h-4 w-4" />}>
                        {t('contact.submit')}
                      </Button>
                      <p className="text-xs text-text-muted text-center">
                        {t('contact.disclaimer')}
                      </p>
                    </form>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-text-primary mb-2">{t('contact.sentTitle')}</h3>
                      <p className="text-text-muted max-w-md mx-auto mb-6">
                        {t('contact.sentBody')}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => { setSent(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
                      >
                        {t('contact.sendAnother')}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Side info — office hours and address, only if published */}
            <div className="space-y-6 lg:col-span-2">
              {hours.length > 0 && (
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-secondary-600" />
                    <h3 className="font-semibold text-text-primary">{t('contact.hoursTitle')}</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-muted">
                    {hours.map((row) => (
                      <li key={row.label} className="flex justify-between gap-4">
                        <span>{t(`contact.${row.label}`)}</span>
                        <span className="font-medium text-text-primary">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {siteContact?.address_line && (
                <Card className="flex flex-col items-center p-8 text-center">
                  <MapPin className="mb-3 h-9 w-9 text-secondary-600" />
                  <p className="font-semibold text-text-primary">{siteContact.address_line}</p>
                  {siteContact.address_city && (
                    <p className="text-sm text-text-muted">{siteContact.address_city}</p>
                  )}
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border-color dark:border-slate-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-10">{t('contact.faqTitle')}</h2>
            <div className="space-y-4">
              {FAQ_KEYS.map((qKey, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border-color dark:border-slate-800 bg-card-bg dark:bg-slate-900 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-text-primary pr-4">{t(`contact.faq.${qKey}`)}</span>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-text-muted shrink-0 transition-transform',
                        openFaq === i && 'rotate-180'
                      )}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed">
                      {t(`contact.faq.a${i + 1}`)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
