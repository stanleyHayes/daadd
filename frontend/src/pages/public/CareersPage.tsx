import React from 'react';
import { PageTransition } from '@/components/ui/PageTransition';
import { Globe, TrendingUp, BookOpen, Clock, MapPin, Mail, Users } from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';
import { useTranslation } from 'react-i18next';
import { useSiteContent, useSiteContact } from '@/hooks/useSiteContent';

// Perk copy lives in the locale files. Role titles and departments stay in
// English on purpose — they are the names the roles are advertised under.
const perks = [
 { icon: Globe, key: 'remote' },
 { icon: TrendingUp, key: 'equity' },
 { icon: BookOpen, key: 'learning' },
 { icon: Clock, key: 'flexible' },
] as const;

export function CareersPage() {
 const { t } = useTranslation();
 const { data: positions = [] } = useSiteContent('job_opening');
 const { data: contact } = useSiteContact();

 return (
 <PageTransition>
 <div>
 {/* Hero */}
 <section className="bg-primary-600 text-white py-20">
          <WatermarkBanner icon={<Users />} />
 <div className="max-w-4xl mx-auto px-4 text-center">
 <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t('careers.title')}</h1>
 <p className="text-lg text-primary-100 max-w-2xl mx-auto">
 {t('careers.subtitle')}
 </p>
 </div>
 </section>

 {/* Why SmartAdDeals */}
 <section className="py-16">
 <div className="max-w-5xl mx-auto px-4">
 <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">{t('careers.perksTitle')}</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
 {perks.map((perk) => {
 const Icon = perk.icon;
 return (
 <div
 key={perk.key}
 className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
 >
 <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-3">
 <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
 </div>
 <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t(`careers.perks.${perk.key}.title`)}</h3>
 <p className="text-sm text-gray-600 dark:text-slate-400">{t(`careers.perks.${perk.key}.desc`)}</p>
 </div>
 );
 })}
 </div>
 </div>
 </section>

 {/* Open Positions */}
 <section className="py-16 bg-gray-50 dark:bg-slate-800/50">
 <div className="max-w-4xl mx-auto px-4">
 <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">{t('careers.openPositions')}</h2>
 {positions.length === 0 ? (
 <p className="text-center text-gray-500 dark:text-slate-400">{t('careers.noRoles')}</p>
 ) : (
 <div className="space-y-4">
 {positions.map((pos) => (
 <div
 key={pos._id}
 className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between"
 >
 <div>
 <h3 className="font-semibold text-gray-900 dark:text-white">{pos.title}</h3>
 <div className="mt-2 flex flex-wrap items-center gap-3">
 {pos.department && (
 <span className="inline-block rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
 {pos.department}
 </span>
 )}
 {pos.location && (
 <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
 <MapPin className="h-3.5 w-3.5" />
 {pos.location}
 </span>
 )}
 </div>
 </div>
 <a
 href={pos.apply_url || (contact?.careers_email ? `mailto:${contact.careers_email}` : '#')}
 className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.98]"
 >
 {t('common.apply')}
 </a>
 </div>
 ))}
 </div>
 )}
 </div>
 </section>

 {/* Bottom CTA */}
 <section className="py-16 bg-primary-600 text-white text-center">
 <div className="max-w-3xl mx-auto px-4">
 <h2 className="text-2xl font-bold mb-3">{t('careers.noRoleTitle')}</h2>
 <p className="text-primary-100 mb-6">
 {t('careers.noRoleDesc')}
 </p>
 <a
 href={contact?.careers_email ? `mailto:${contact.careers_email}` : "#"}
 className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-primary-700 font-medium hover:bg-gray-100 active:scale-[0.98] transition-all"
 >
 <Mail className="h-5 w-5" />
 {contact?.careers_email || t("careers.emailUnset")}
 </a>
 </div>
 </section>
 </div>
 </PageTransition>
 );
}
