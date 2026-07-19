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

const contactChannels = [
  {
    icon: Mail,
    title: 'Email us',
    description: 'hello@daadd.example',
    href: 'mailto:hello@daadd.example',
    color: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
  },
  {
    icon: Phone,
    title: 'Call us',
    description: '+1 (555) 123-4567',
    href: 'tel:+15551234567',
    color: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
  },
  {
    icon: MapPin,
    title: 'Visit us',
    description: '123 AdTech Blvd, Suite 100',
    href: '#',
    color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  },
  {
    icon: MessageCircle,
    title: 'Live chat',
    description: 'Available in-app for registered users',
    href: '/login',
    color: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  },
  {
    icon: HelpCircle,
    title: 'Help Center',
    description: 'Browse answers to common questions',
    href: '#',
    color: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Join the SmartDeals community',
    href: '#',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
];

const faqs = [
  {
    question: 'How quickly do you respond to inquiries?',
    answer: 'We aim to reply to all messages within one business day. Enterprise customers receive priority support.',
  },
  {
    question: 'Can I schedule a demo for my team?',
    answer: 'Absolutely. Fill out the form with your company details and select "Sales demo" as the topic. Our team will reach out to schedule a time.',
  },
  {
    question: 'Do you offer custom enterprise plans?',
    answer: 'Yes. We offer tailored plans for agencies and large advertisers. Contact our sales team for pricing and onboarding options.',
  },
  {
    question: 'Where can I find technical documentation?',
    answer: 'Registered users can access our docs from the dashboard. You can also request API documentation through this form.',
  },
];

const topicOptions = [
  { value: 'general', label: 'General inquiry' },
  { value: 'sales', label: 'Sales demo' },
  { value: 'support', label: 'Technical support' },
  { value: 'partners', label: 'Partnerships' },
  { value: 'feedback', label: 'Feedback' },
];

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent! We will get back to you soon.');
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
              <p className="text-secondary-300 font-semibold tracking-wide uppercase text-sm mb-3">Contact</p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
                We would love to hear from you
              </h1>
              <p className="text-lg text-primary-100 leading-relaxed">
                Have a question, feedback, or a partnership idea? Pick a channel below or send us a message directly.
              </p>
            </div>
          </div>
        </section>

        {/* Contact channels — bento grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contactChannels.map((channel) => (
              <a
                key={channel.title}
                href={channel.href}
                className="group bg-card-bg dark:bg-slate-900 border border-border-color dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', channel.color)}>
                  <channel.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-text-primary mb-1 group-hover:text-secondary-600 transition-colors">
                  {channel.title}
                </h3>
                <p className="text-sm text-text-muted">{channel.description}</p>
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
                  <h2 className="text-xl font-bold text-white">Send us a message</h2>
                  <p className="text-primary-100 text-sm mt-1">Fill out the form and we will respond as soon as possible.</p>
                </div>
                <div className="p-6 sm:p-8">
                  {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input
                          label="Name"
                          placeholder="Your name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                        <Input
                          label="Email"
                          type="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                        />
                      </div>
                      <Select
                        label="Topic"
                        placeholder="Choose a topic"
                        options={topicOptions}
                        value={form.topic}
                        onChange={(value) => setForm({ ...form, topic: value })}
                        fullWidth
                      />
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Message</label>
                        <textarea
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          rows={5}
                          required
                          placeholder="How can we help you?"
                          className="block w-full rounded-lg border border-border-color dark:border-slate-600 bg-bg-primary dark:bg-slate-800 px-3 py-2.5 text-sm dark:text-white placeholder:text-text-muted focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 focus:outline-none resize-y"
                        />
                      </div>
                      <Button type="submit" fullWidth icon={<Send className="h-4 w-4" />}>
                        Send Message
                      </Button>
                      <p className="text-xs text-text-muted text-center">
                        By submitting, you agree to our privacy policy and terms of service.
                      </p>
                    </form>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-text-primary mb-2">Message Sent!</h3>
                      <p className="text-text-muted max-w-md mx-auto mb-6">
                        Thank you for reaching out. We have received your message and will respond shortly.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => { setSent(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
                      >
                        Send another message
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
                  <h3 className="font-semibold text-text-primary">Office hours</h3>
                </div>
                <ul className="space-y-3 text-sm text-text-muted">
                  <li className="flex justify-between">
                    <span>Monday – Friday</span>
                    <span className="font-medium text-text-primary">9:00 AM – 6:00 PM EST</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-medium text-text-primary">10:00 AM – 2:00 PM EST</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium text-text-primary">Closed</span>
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
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-10">Frequently asked questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border-color dark:border-slate-800 bg-card-bg dark:bg-slate-900 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-text-primary pr-4">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-text-muted shrink-0 transition-transform',
                        openFaq === i && 'rotate-180'
                      )}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed">
                      {faq.answer}
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

