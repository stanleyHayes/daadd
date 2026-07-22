import React from 'react';
import { PageTransition } from '@/components/ui/PageTransition';
import { Globe, TrendingUp, BookOpen, Clock, MapPin, Mail, Users } from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';
import toast from 'react-hot-toast';

const perks = [
 {
 icon: Globe,
 title: 'Remote-First',
 description: 'Work from anywhere in the world. We believe great talent is not limited by geography.',
 },
 {
 icon: TrendingUp,
 title: 'Competitive Equity',
 description: 'All full-time employees receive meaningful equity so you share in the success you help build.',
 },
 {
 icon: BookOpen,
 title: 'Learning Budget',
 description: '$2,000 annual learning budget for courses, conferences, books, or any growth opportunity.',
 },
 {
 icon: Clock,
 title: 'Flexible Hours',
 description: 'We care about output, not hours logged. Structure your day around your life.',
 },
];

const positions = [
 {
 title: 'Senior Backend Engineer',
 department: 'Engineering',
 location: 'Remote',
 departmentColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
 },
 {
 title: 'React Native Developer',
 department: 'Engineering',
 location: 'Remote',
 departmentColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
 },
 {
 title: 'ML Engineer - Ad Optimization',
 department: 'AI/ML',
 location: 'Remote',
 departmentColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
 },
 {
 title: 'Product Designer',
 department: 'Design',
 location: 'New York',
 departmentColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
 },
 {
 title: 'Growth Marketing Manager',
 department: 'Marketing',
 location: 'London',
 departmentColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
 },
];

export function CareersPage() {
 return (
 <PageTransition>
 <div>
 {/* Hero */}
 <section className="bg-primary-600 text-white py-20">
          <WatermarkBanner icon={<Users />} />
 <div className="max-w-4xl mx-auto px-4 text-center">
 <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Join Our Team</h1>
 <p className="text-lg text-primary-100 max-w-2xl mx-auto">
 Help us build the future of AdTech. We are creating a platform where advertising is transparent, rewarding, and powered by AI.
 </p>
 </div>
 </section>

 {/* Why SmartAdDeals */}
 <section className="py-16">
 <div className="max-w-5xl mx-auto px-4">
 <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">Why SmartAdDeals?</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 {perks.map((perk) => {
 const Icon = perk.icon;
 return (
 <div
 key={perk.title}
 className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
 >
 <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-3">
 <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
 </div>
 <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{perk.title}</h3>
 <p className="text-sm text-gray-600 dark:text-slate-400">{perk.description}</p>
 </div>
 );
 })}
 </div>
 </div>
 </section>

 {/* Open Positions */}
 <section className="py-16 bg-gray-50 dark:bg-slate-800/50">
 <div className="max-w-4xl mx-auto px-4">
 <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">Open Positions</h2>
 <div className="space-y-4">
 {positions.map((pos) => (
 <div
 key={pos.title}
 className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
 >
 <div>
 <h3 className="font-semibold text-gray-900 dark:text-white">{pos.title}</h3>
 <div className="flex items-center gap-3 mt-2">
 <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${pos.departmentColor}`}>
 {pos.department}
 </span>
 <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
 <MapPin className="h-3.5 w-3.5" />
 {pos.location}
 </span>
 </div>
 </div>
 <button
 onClick={() => toast.success(`Application for ${pos.title} submitted! We'll be in touch.`)}
 className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all"
 >
 Apply
 </button>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Bottom CTA */}
 <section className="py-16 bg-primary-600 text-white text-center">
 <div className="max-w-3xl mx-auto px-4">
 <h2 className="text-2xl font-bold mb-3">Don't see your role?</h2>
 <p className="text-primary-100 mb-6">
 We are always looking for talented people. Send us your resume and tell us how you would contribute to SmartAdDeals.
 </p>
 <a
 href="mailto:careers@daadd.com"
 className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-primary-700 font-medium hover:bg-gray-100 active:scale-[0.98] transition-all"
 >
 <Mail className="h-5 w-5" />
 careers@daadd.com
 </a>
 </div>
 </section>
 </div>
 </PageTransition>
 );
}
