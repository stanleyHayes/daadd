import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from 'react-i18next';
import {
 Zap,
 Search,
 Menu,
 X,
 LogOut,
 LayoutDashboard,
 Globe,
 Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { getInitials } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { WatermarkPattern } from '@/components/ui/Watermark';
import { cn } from '@/lib/utils';

export function PublicLayout() {
 const navigate = useNavigate();
 const location = useLocation();
 const { user, isAuthenticated, logout } = useAuthStore();
 const { t } = useTranslation();
 const [searchQuery, setSearchQuery] = useState('');
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [scrolled, setScrolled] = useState(false);
 const navRef = useRef<HTMLDivElement>(null);
 const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

 useEffect(() => {
 const handleScroll = () => setScrolled(window.scrollY > 10);
 window.addEventListener('scroll', handleScroll, { passive: true });
 return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 useEffect(() => {
 setMobileMenuOpen(false);
 }, [location.pathname]);

 useEffect(() => {
 const activeLink = navRef.current?.querySelector('[data-active="true"]') as HTMLElement | null;
 if (activeLink) {
 setIndicatorStyle({
 left: activeLink.offsetLeft,
 width: activeLink.offsetWidth,
 opacity: 1,
 });
 } else {
 setIndicatorStyle((s) => ({ ...s, opacity: 0 }));
 }
 }, [location.pathname]);

 const handleSearch = (e: React.FormEvent) => {
 e.preventDefault();
 if (searchQuery.trim()) {
 navigate(`/ads?search=${encodeURIComponent(searchQuery.trim())}`);
 setSearchQuery('');
 }
 };

 const navLinks = [
 { to: '/ads', label: t('header.nav.ads') },
 { to: '/partners', label: t('header.nav.partners') },
 { to: '/about', label: t('header.nav.about') },
 { to: '/blog', label: t('header.nav.blog') },
 ];

 const isActive = (to: string) => location.pathname.startsWith(to);

 return (
 <div className="min-h-screen bg-bg-primary dark:bg-slate-950 flex flex-col relative overflow-x-hidden">

 {/* Utility bar */}
 <div className="hidden md:flex items-center justify-between px-6 py-2 bg-primary-800 text-white/80 text-xs">
 <div className="flex items-center gap-2">
 <span className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
 <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-500" />
 </span>
 <span>Platform operational — v1.0 live</span>
 </div>
 <div className="flex items-center gap-4">
 <Link to="/about" className="hover:text-white transition-colors">About</Link>
 <Link to="/careers" className="hover:text-white transition-colors">Careers</Link>
 <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
 </div>
 </div>

 {/* Header */}
 <header
 className={cn(
 'sticky top-0 z-40 transition-all duration-300 border-b',
 scrolled
 ? 'bg-bg-primary/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-md border-border-color dark:border-slate-800'
 : 'bg-bg-primary/80 dark:bg-slate-950/80 backdrop-blur-sm border-transparent'
 )}
 >
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 {/* Logo */}
 <Link to="/" className="flex items-center gap-2.5 group">
 <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary-500 shadow-lg shadow-secondary-500/25 group-hover:shadow-secondary-500/40 transition-shadow">
 <Zap className="h-5 w-5 text-primary-900" />
 </div>
 <span className="text-lg font-bold gradient-text">DAADD</span>
 </Link>

 {/* Pill navbar */}
 <nav
 ref={navRef}
 className="hidden md:flex items-center relative bg-bg-tertiary dark:bg-slate-900 rounded-full p-1 border border-border-color dark:border-slate-800"
 >
 <div
 className="absolute top-1 bottom-1 bg-card-bg dark:bg-slate-800 rounded-full shadow-sm border border-border-color dark:border-slate-700 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
 style={{
 left: indicatorStyle.left,
 width: indicatorStyle.width,
 opacity: indicatorStyle.opacity,
 }}
 />
 {navLinks.map((link) => (
 <Link
 key={link.to}
 to={link.to}
 data-active={isActive(link.to)}
 className={cn(
 'relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
 isActive(link.to)
 ? 'text-primary-700 dark:text-secondary-300'
 : 'text-text-secondary hover:text-text-primary'
 )}
 >
 {link.label}
 </Link>
 ))}
 </nav>

 {/* Right side */}
 <div className="flex items-center gap-3">
 <form onSubmit={handleSearch} className="relative hidden lg:block">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
 <input
 type="text"
 placeholder="Search ads..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-56 pl-10 pr-4 py-2 rounded-full border border-border-color dark:border-slate-700 bg-bg-secondary dark:bg-slate-900 text-sm placeholder:text-text-muted dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500/30 focus:border-secondary-500 transition-all"
 />
 </form>

 <div className="hidden sm:flex items-center">
 <LanguageSwitcher />
 </div>

 <div className="hidden sm:flex items-center">
 <ThemeToggle />
 </div>

 {isAuthenticated ? (
 <div className="hidden sm:flex items-center gap-2">
 <button
 onClick={() => navigate('/dashboard')}
 className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-text-secondary hover:bg-bg-tertiary dark:hover:bg-slate-800 transition-colors"
 >
 <div className="w-8 h-8 rounded-full bg-secondary-400 flex items-center justify-center text-primary-900 text-xs font-bold">
 {user ? getInitials(user.name) : 'U'}
 </div>
 <span className="hidden md:inline">{user?.name}</span>
 </button>
 </div>
 ) : (
 <div className="hidden sm:flex items-center gap-2">
 <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
 Log in
 </Button>
 <Button size="sm" onClick={() => navigate('/register')}>
 {t('header.cta')}
 </Button>
 </div>
 )}

 <button
 className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary dark:hover:bg-slate-800"
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 >
 {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
 </button>
 </div>
 </div>
 </div>

 {/* Mobile menu */}
 <AnimatePresence>
 {mobileMenuOpen && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="md:hidden overflow-hidden border-t border-border-color dark:border-slate-800 bg-bg-primary dark:bg-slate-950"
 >
 <div className="px-4 py-4 space-y-3">
 <form onSubmit={handleSearch} className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
 <input
 type="text"
 placeholder="Search ads..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-color dark:border-slate-700 bg-bg-secondary dark:bg-slate-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500/30"
 />
 </form>

 {navLinks.map((link) => (
 <Link
 key={link.to}
 to={link.to}
 className={cn(
 'block px-3 py-2.5 rounded-xl text-sm font-medium',
 isActive(link.to)
 ? 'text-primary-700 dark:text-secondary-300 bg-secondary-500/10'
 : 'text-text-secondary'
 )}
 >
 {link.label}
 </Link>
 ))}

 <div className="pt-2 border-t border-border-color dark:border-slate-800 flex items-center gap-4 px-3">
 <LanguageSwitcher />
 <ThemeToggle />
 </div>

 {isAuthenticated ? (
 <div className="pt-2 space-y-2">
 <button
 onClick={() => navigate('/dashboard')}
 className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-tertiary dark:hover:bg-slate-800"
 >
 <LayoutDashboard className="h-4 w-4" />
 Dashboard
 </button>
 <button
 onClick={() => { logout(); navigate('/'); }}
 className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
 >
 <LogOut className="h-4 w-4" />
 Logout
 </button>
 </div>
 ) : (
 <div className="pt-2 flex gap-2">
 <Button variant="outline" className="flex-1" onClick={() => navigate('/login')}>
 Log in
 </Button>
 <Button className="flex-1" onClick={() => navigate('/register')}>
 Sign up
 </Button>
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </header>

 <main className="flex-1 relative">
 <WatermarkPattern />
 <Outlet />
 </main>

 <ScrollToTop />

 {/* Footer */}
 <footer className="relative bg-primary-900 text-white overflow-hidden">
 <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
 <div className="lg:col-span-2">
 <div className="flex items-center gap-2.5 mb-4">
 <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary-400">
 <Zap className="h-5 w-5 text-primary-900" />
 </div>
 <span className="text-xl font-bold">DAADD</span>
 </div>
 <p className="text-sm leading-relaxed max-w-sm mb-6 text-white/70">
 The intelligent advertising platform that connects brands with engaged audiences.
 Browse curated ads and earn real rewards for your attention.
 </p>
 <div className="flex gap-2">
 <div className="relative flex-1">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
 <input
 type="email"
 placeholder="Enter your email"
 className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-primary-800 border border-primary-700 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/30 focus:border-secondary-500"
 />
 </div>
 <Button size="sm" className="bg-secondary-500 hover:bg-secondary-600 text-primary-900 font-semibold">
 Subscribe
 </Button>
 </div>
 </div>

 <div>
 <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
 <ul className="space-y-3 text-sm text-white/70">
 <li><Link to="/ads" className="hover:text-secondary-300 transition-colors">Browse Ads</Link></li>
 <li><Link to="/partners" className="hover:text-secondary-300 transition-colors">Partners</Link></li>
 <li><Link to="/register" className="hover:text-secondary-300 transition-colors">For Advertisers</Link></li>
 <li><Link to="/ads" className="hover:text-secondary-300 transition-colors">Earn Rewards</Link></li>
 <li><Link to="/blog" className="hover:text-secondary-300 transition-colors">Blog</Link></li>
 </ul>
 </div>

 <div>
 <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
 <ul className="space-y-3 text-sm text-white/70">
 <li><Link to="/about" className="hover:text-secondary-300 transition-colors">About</Link></li>
 <li><Link to="/careers" className="hover:text-secondary-300 transition-colors">Careers</Link></li>
 <li><Link to="/blog" className="hover:text-secondary-300 transition-colors">Blog</Link></li>
 <li><Link to="/contact" className="hover:text-secondary-300 transition-colors">Contact</Link></li>
 </ul>
 </div>

 <div>
 <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
 <ul className="space-y-3 text-sm text-white/70">
 <li><Link to="/privacy" className="hover:text-secondary-300 transition-colors">{t('footer.links.privacy')}</Link></li>
 <li><Link to="/terms" className="hover:text-secondary-300 transition-colors">{t('footer.links.terms')}</Link></li>
 <li><Link to="/cookies" className="hover:text-secondary-300 transition-colors">{t('footer.links.cookies')}</Link></li>
 </ul>
 </div>
 </div>

 <div className="gold-hairline w-full mt-12 mb-8" />

 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
 <p className="text-sm text-white/60">{t('footer.copyright')}</p>
 <div className="flex items-center gap-4 text-white/60">
 <Globe className="h-4 w-4" />
 <span className="text-sm">English</span>
 </div>
 </div>
 </div>
 </footer>
 </div>
 );
}
