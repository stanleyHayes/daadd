import { useEffect, useState, type FormEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Globe2,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Search,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { useAuthStore } from '@/stores/auth.store';
import { getInitials } from '@/lib/utils';
import { languages } from '@/i18n/config';

export function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/ads?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
  };

  const navLinks = [
    { to: '/ads', label: t('header.nav.ads') },
    { to: '/partners', label: t('header.nav.partners') },
    { to: '/about', label: t('header.nav.about') },
    { to: '/blog', label: t('header.nav.blog') },
  ];
  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <div className="public-site min-h-screen bg-bg-primary text-text-primary">
      <div className="relative z-50 bg-primary-900 text-white">
        <div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75 sm:text-xs">
          <Sparkles className="h-3.5 w-3.5 text-secondary-400" />
          <span>Attention should create value for everyone.</span>
          <Link to="/about" className="hidden items-center gap-1 text-secondary-300 transition-colors hover:text-white sm:inline-flex">
            Our approach <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${scrolled ? 'border-slate-200/80 bg-white/90 shadow-[0_14px_50px_rgba(7,20,49,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90' : 'border-transparent bg-white/95 dark:bg-slate-950/95'}`}>
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-8 px-4 sm:px-6 lg:px-10">
          <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="SmartAdDeals home">
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-[14px] bg-primary-800 shadow-[0_8px_24px_rgba(0,27,80,0.22)]">
              <span className="absolute inset-x-0 bottom-0 h-1/2 bg-secondary-400" />
              <Zap className="relative h-5 w-5 fill-white text-white mix-blend-difference" />
            </span>
            <span className="text-lg font-extrabold tracking-[-0.04em] text-primary-900 dark:text-white">
              SmartAd<span className="text-secondary-600 dark:text-secondary-400">Deals</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${isActive(link.to) ? 'bg-primary-900 text-white shadow-sm dark:bg-secondary-400 dark:text-primary-900' : 'text-slate-600 hover:bg-slate-100 hover:text-primary-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <form onSubmit={handleSearch} className="relative hidden xl:block">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('header.searchPlaceholder')}
                className="h-10 w-48 rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:w-60 focus:border-secondary-500 focus:bg-white focus:ring-4 focus:ring-secondary-400/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </form>
            <div className="hidden items-center sm:flex"><LanguageSwitcher /></div>
            <div className="hidden items-center sm:flex"><ThemeToggle /></div>

            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-slate-700 transition hover:border-secondary-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-900 text-[10px] font-bold text-white dark:bg-secondary-400 dark:text-primary-900">{user ? getInitials(user.name) : 'U'}</span>
                {user?.name?.split(' ')[0]}
              </button>
            ) : (
              <div className="hidden items-center gap-1.5 sm:flex">
                <Button variant="ghost" size="sm" shape="pill" onClick={() => navigate('/login')}>{t('header.login')}</Button>
                <Button size="sm" shape="pill" className="h-10 px-5! shadow-[0_8px_20px_rgba(0,27,80,0.18)]" onClick={() => navigate('/register')}>
                  {t('header.cta')} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <button className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700 lg:hidden dark:border-slate-700 dark:text-slate-200" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-950">
              <div className="mx-auto max-w-[1440px] space-y-2 px-4 py-5 sm:px-6">
                <form onSubmit={handleSearch} className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t('header.searchPlaceholder')} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                </form>
                {navLinks.map((link) => <Link key={link.to} to={link.to} className={`flex items-center justify-between rounded-2xl px-4 py-3 font-semibold ${isActive(link.to) ? 'bg-primary-900 text-white' : 'text-slate-700 dark:text-slate-200'}`}>{link.label}<ArrowRight className="h-4 w-4" /></Link>)}
                <div className="flex items-center justify-between border-t border-slate-200 px-3 pt-4 dark:border-slate-800"><LanguageSwitcher /><ThemeToggle /></div>
                {isAuthenticated ? (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" shape="rounded" onClick={() => navigate('/dashboard')}><LayoutDashboard className="h-4 w-4" /> {t('header.dashboard')}</Button>
                    <Button variant="ghost" shape="rounded" onClick={() => { logout(); navigate('/'); }}><LogOut className="h-4 w-4" /> {t('header.logout')}</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2"><Button variant="outline" shape="rounded" onClick={() => navigate('/login')}>{t('header.login')}</Button><Button shape="rounded" onClick={() => navigate('/register')}>{t('header.signup')}</Button></div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative min-h-[60vh] overflow-hidden"><Outlet /></main>
      <ScrollToTop />

      <footer className="relative overflow-hidden bg-[#06112b] text-white">
        <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-secondary-400/10 blur-3xl" />
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="mb-16 grid gap-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-secondary-300"><Sparkles className="h-4 w-4" /> The attention exchange</span>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Better ads. Real rewards. Smarter growth.</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button shape="pill" size="lg" className="bg-secondary-400! text-primary-900! hover:bg-secondary-300!" onClick={() => navigate('/ads')}>Explore live ads <ArrowRight className="h-4 w-4" /></Button>
              <Button shape="pill" size="lg" className="border-white/20! bg-white/5! text-white! hover:bg-white/10!" variant="outline" onClick={() => navigate('/register')}>Create a campaign</Button>
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1.5fr_0.75fr_0.75fr_0.75fr]">
            <div>
              <Link to="/" className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[14px] bg-secondary-400"><Zap className="h-5 w-5 fill-primary-900 text-primary-900" /></span><span className="text-xl font-extrabold tracking-[-0.04em]">SmartAdDeals</span></Link>
              <p className="max-w-sm text-sm leading-7 text-white/55">{t('footer.blurb')}</p>
              <form className="mt-6 flex max-w-md gap-2" onSubmit={(event) => event.preventDefault()}>
                <label className="relative min-w-0 flex-1"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><input type="email" aria-label="Email address" placeholder={t('common.emailPlaceholder')} className="h-11 w-full rounded-full border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-secondary-400" /></label>
                <Button size="sm" shape="pill" className="bg-white! px-5! text-primary-900!">{t('common.subscribe')}</Button>
              </form>
            </div>
            <FooterColumn title={t('footer.platform.title')} links={[[t('footer.platform.browseAds'), '/ads'], [t('footer.platform.partners'), '/partners'], [t('footer.platform.forAdvertisers'), '/register'], [t('footer.platform.blog'), '/blog']]} />
            <FooterColumn title={t('footer.company.title')} links={[[t('footer.company.about'), '/about'], [t('footer.company.careers'), '/careers'], [t('footer.company.contact'), '/contact'], ['Support', '/support']]} />
            <FooterColumn title={t('footer.legal.title')} links={[[t('footer.links.privacy'), '/privacy'], [t('footer.links.terms'), '/terms'], [t('footer.links.cookies'), '/cookies']]} />
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>{t('footer.copyright')}</p>
            <p className="flex items-center gap-2"><Globe2 className="h-4 w-4" /> {languages[(i18n.resolvedLanguage ?? i18n.language) as keyof typeof languages]?.name} · Built for meaningful attention</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/40">{title}</h3>
      <ul className="space-y-3.5 text-sm text-white/65">
        {links.map(([label, to]) => <li key={`${label}-${to}`}><Link to={to} className="transition-colors hover:text-secondary-300">{label}</Link></li>)}
      </ul>
    </div>
  );
}
