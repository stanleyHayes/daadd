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
  MessageCircle,
  HelpCircle,
  Users,
  Send,
  CheckCircle,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Channel labels live in the locale files; only addresses, phone numbers and
// styling stay here. Channels without a literal `value` render a translated one.
const contactChannels = [
  { icon: Mail, key: 'email', value: 'hello@daadd.example', href: 'mailto:hello@daadd.example',
    color: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300' },
  { icon: Phone, key: 'phone', value: '+1 (555) 123-4567', href: 'tel:+15551234567',
    color: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' },
  { icon: MapPin, key: 'visit', value: '123 AdTech Blvd, Suite 100', href: '#',
    color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' },
  { icon: MessageCircle, key: 'chat', href: '/login',
    color: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300' },
  { icon: HelpCircle, key: 'help', href: '#',
    color: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300' },
  { icon: Users, key: 'community', href: '#',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
] as const;

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4'] as const;

const TOPIC_KEYS = ['general', 'sales', 'support', 'partners', 'feedback'] as const;

export function ContactPage() {
  const { t } = useTranslation();
  const topicOptions = TOPIC_KEYS.map((k) => ({ value: k, label: t(`contact.topics.${k}`) }));
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('contact.sentToast'));
    setSent(true);
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

        {/* Contact channels — bento grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contactChannels.map((channel) => (
              <a
                key={channel.key}
                href={channel.href}
                className="group bg-card-bg dark:bg-slate-900 border border-border-color dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', channel.color)}>
                  <channel.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-text-primary mb-1 group-hover:text-secondary-600 transition-colors">
                  {t(`contact.channels.${channel.key}`)}
                </h3>
                <p className="text-sm text-text-muted">{'value' in channel ? channel.value : t(`contact.channels.${channel.key}Value`)}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Form + map/availability */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden border-0 shadow-lg">
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
                      <Button type="submit" fullWidth icon={<Send className="h-4 w-4" />}>
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

            {/* Side info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5 text-secondary-600" />
                  <h3 className="font-semibold text-text-primary">{t('contact.hoursTitle')}</h3>
                </div>
                <ul className="space-y-3 text-sm text-text-muted">
                  <li className="flex justify-between">
                    <span>{t('contact.weekdays')}</span>
                    <span className="font-medium text-text-primary">{t('contact.weekdaysHours')}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>{t('contact.saturday')}</span>
                    <span className="font-medium text-text-primary">{t('contact.saturdayHours')}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>{t('contact.sunday')}</span>
                    <span className="font-medium text-text-primary">{t('contact.closed')}</span>
                  </li>
                </ul>
              </Card>

              <div className="rounded-2xl overflow-hidden border border-border-color dark:border-slate-700 h-64 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                <div className="text-center p-6">
                  <MapPin className="h-10 w-10 text-secondary-600 mx-auto mb-3" />
                  <p className="font-semibold text-text-primary">123 AdTech Blvd, Suite 100</p>
                  <p className="text-sm text-text-muted">San Francisco, CA 94105</p>
                </div>
              </div>
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

