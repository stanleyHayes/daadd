import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Search,
 LogOut,
 User,
 Settings,
 ChevronDown,
 Zap,
 Plus,
 Sparkles,
 HelpCircle,
 Command,
 X,
 LifeBuoy,
 Moon,
 Sun,
 Globe,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { runThemeTransition } from '@/lib/theme-transition';
import { getInitials } from '@/lib/utils';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils';

const breadcrumbLabels: Record<string, string> = {
 dashboard: 'Dashboard',
 campaigns: 'Campaigns',
 new: 'Create New',
 analytics: 'Analytics',
 heatmaps: 'Heatmaps',
 'ai-optimization': 'AI Optimization',
 anomalies: 'Anomalies',
 benchmarking: 'Benchmarking',
 storyteller: 'Storyteller',
 team: 'Team',
 settings: 'Settings',
 profile: 'My Profile',
};

const commandItems = [
 { icon: Plus, label: 'New Campaign', description: 'Create a new ad campaign', action: '/dashboard/campaigns/new' },
 { icon: MegaphoneAlias, label: 'Campaigns', description: 'View all campaigns', action: '/dashboard/campaigns' },
 { icon: BarChartAlias, label: 'Analytics', description: 'Campaign analytics', action: '/dashboard/analytics' },
 { icon: Sparkles, label: 'AI Optimization', description: 'AI recommendations', action: '/dashboard/ai-optimization' },
 { icon: Settings, label: 'Settings', description: 'Account preferences', action: '/dashboard/settings' },
];

function MegaphoneAlias(props: { className?: string }) {
 return <Zap className={props.className} />;
}
function BarChartAlias(props: { className?: string }) {
 return <Sparkles className={props.className} />;
}

export function TopBar() {
 const navigate = useNavigate();
 const location = useLocation();
 const { user, logout } = useAuthStore();
 const { theme, toggleTheme } = useThemeStore();
 const [searchQuery, setSearchQuery] = useState('');
 const [userMenuOpen, setUserMenuOpen] = useState(false);
 const [showCommandPalette, setShowCommandPalette] = useState(false);
 const [commandFilter, setCommandFilter] = useState('');
 const searchInputRef = useRef<HTMLInputElement>(null);
 const userMenuRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
 e.preventDefault();
 setShowCommandPalette((prev) => !prev);
 }
 if ((e.metaKey || e.ctrlKey) && e.key === '/') {
 e.preventDefault();
 searchInputRef.current?.focus();
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
 setUserMenuOpen(false);
 }
 };
 if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [userMenuOpen]);

 const handleLogout = () => {
 logout();
 navigate('/login');
 };

 const handleSearch = (e: React.KeyboardEvent<HTMLInputElement> | React.FormEvent) => {
 if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
 e.preventDefault();
 if (searchQuery.trim()) {
 navigate(`/dashboard/campaigns?search=${encodeURIComponent(searchQuery)}`);
 }
 };

 const pathSegments = location.pathname.split('/').filter(Boolean);
 const breadcrumbs = pathSegments.map((segment, i) => ({
 label: breadcrumbLabels[segment] || segment,
 path: '/' + pathSegments.slice(0, i + 1).join('/'),
 isLast: i === pathSegments.length - 1,
 }));

 const filteredCommands = commandItems.filter(
 (c) =>
 c.label.toLowerCase().includes(commandFilter.toLowerCase()) ||
 c.description.toLowerCase().includes(commandFilter.toLowerCase())
 );

 const roleLabel = user?.role ? user.role.replace('_', ' ') : 'Member';

 return (
 <>
 <header className="sticky top-0 z-40 h-[72px] flex items-center">
 <div className="mx-4 md:mx-6 flex-1">
 <div className="flex items-center justify-between h-14 px-4 bg-card-bg/80 dark:bg-slate-950/80 backdrop-blur-xl border border-border-color dark:border-slate-800 rounded-2xl shadow-sm">
 {/* Left: Breadcrumb */}
 <nav className="hidden lg:flex items-center gap-1.5 text-sm">
 {breadcrumbs.slice(0, 3).map((crumb, i) => (
 <React.Fragment key={crumb.path}>
 {i > 0 && <span className="text-text-muted">/</span>}
 <button
 onClick={() => !crumb.isLast && navigate(crumb.path)}
 className={cn(
 'px-2 py-1 rounded-md transition-colors',
 crumb.isLast
 ? 'font-semibold text-text-primary'
 : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
 )}
 >
 {crumb.label}
 </button>
 </React.Fragment>
 ))}
 </nav>

 {/* Center: Search pill */}
 <div className="flex-1 flex justify-center max-w-xl mx-4">
 <div className="relative w-full hidden md:block">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
 <input
 ref={searchInputRef}
 type="text"
 placeholder="Search campaigns..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 onKeyDown={handleSearch}
 className="w-full pl-10 pr-20 py-2 rounded-full border border-border-color dark:border-slate-700 bg-bg-secondary dark:bg-slate-900 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-secondary-500/30 focus:border-secondary-500 transition-all"
 />
 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
 <button
 onClick={() => setShowCommandPalette(true)}
 className="p-1.5 rounded-full hover:bg-bg-tertiary dark:hover:bg-slate-800 text-text-muted transition-colors"
 title="Command palette"
 >
 <Command className="h-3.5 w-3.5" />
 </button>
 <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-bg-tertiary dark:bg-slate-800 text-text-muted">
 ⌘K
 </kbd>
 </div>
 </div>
 </div>

 {/* Right: Actions */}
 <div className="flex items-center gap-2">
 <button
 onClick={() => navigate('/dashboard/campaigns/new')}
 className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium transition-all shadow-lg shadow-primary-700/20 active:scale-95"
 >
 <Plus className="h-4 w-4" />
 <span className="hidden xl:inline">New Campaign</span>
 </button>

 <button
 onClick={(e) => runThemeTransition(e, toggleTheme)}
 className="hidden sm:flex p-2.5 rounded-full text-text-secondary hover:bg-bg-tertiary dark:hover:bg-slate-800 transition-colors"
 aria-label="Toggle theme"
 >
 {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
 </button>

 <NotificationDropdown />

 <button className="hidden sm:flex p-2.5 rounded-full text-text-secondary hover:bg-bg-tertiary dark:hover:bg-slate-800 transition-colors">
 <HelpCircle className="h-5 w-5" />
 </button>

 {/* User pill */}
 <div className="relative" ref={userMenuRef}>
 <button
 onClick={() => setUserMenuOpen(!userMenuOpen)}
 className={cn(
 'flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border transition-all',
 userMenuOpen
 ? 'bg-bg-tertiary dark:bg-slate-800 border-secondary-500/50 shadow-sm'
 : 'border-border-color dark:border-slate-700 hover:border-secondary-500/30 hover:bg-bg-tertiary dark:hover:bg-slate-800'
 )}
 >
 <div className="w-8 h-8 rounded-full bg-secondary-400 flex items-center justify-center text-primary-900 text-sm font-bold">
 {user ? getInitials(user.name) : 'U'}
 </div>
 <div className="hidden md:flex flex-col items-start">
 <span className="text-xs font-semibold text-text-primary leading-tight">{user?.name || 'User'}</span>
 <span className="text-[10px] text-text-muted capitalize leading-tight">{roleLabel}</span>
 </div>
 <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', userMenuOpen && 'rotate-180')} />
 </button>

 <AnimatePresence>
 {userMenuOpen && (
 <motion.div
 initial={{ opacity: 0, y: 8, scale: 0.96 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 8, scale: 0.96 }}
 transition={{ duration: 0.15 }}
 className="absolute right-0 top-full mt-2 w-72 bg-card-bg dark:bg-slate-900 rounded-2xl border border-border-color dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
 >
 {/* Identity band */}
 <div className="relative px-4 py-4 bg-primary-700">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-full bg-secondary-400 flex items-center justify-center text-primary-900 text-lg font-bold shadow-lg">
 {user ? getInitials(user.name) : 'U'}
 </div>
 <div className="min-w-0">
 <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
 <p className="text-xs text-white/70 truncate">{user?.email || ''}</p>
 </div>
 </div>
 <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-500/20 text-secondary-300 border border-secondary-500/20">
 <Sparkles className="h-3 w-3" />
 {roleLabel}
 </div>
 </div>

 {/* Menu */}
 <div className="p-2">
 <MenuButton
 icon={User}
 label="Profile"
 description="View your profile"
 onClick={() => {
 setUserMenuOpen(false);
 navigate('/dashboard/profile');
 }}
 />
 <MenuButton
 icon={Settings}
 label="Settings"
 description="Preferences & account"
 onClick={() => {
 setUserMenuOpen(false);
 navigate('/dashboard/settings');
 }}
 />
 <MenuButton
 icon={Globe}
 label="View public site"
 description="Open the public marketing site"
 onClick={() => {
 setUserMenuOpen(false);
 navigate('/');
 }}
 />
 <MenuButton
 icon={LifeBuoy}
 label="Support"
 description="Get help & resources"
 onClick={() => setUserMenuOpen(false)}
 />
 </div>

 <div className="border-t border-border-color dark:border-slate-800 p-2">
 <button
 onClick={handleLogout}
 className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors"
 >
 <LogOut className="h-4 w-4" />
 Sign out
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>
 </div>
 </header>

 {/* Command Palette */}
 <AnimatePresence>
 {showCommandPalette && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24"
 onClick={() => setShowCommandPalette(false)}
 >
 <motion.div
 initial={{ opacity: 0, y: -20, scale: 0.96 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -20, scale: 0.96 }}
 onClick={(e) => e.stopPropagation()}
 className="w-full max-w-xl rounded-2xl bg-card-bg dark:bg-slate-900 shadow-2xl border border-border-color dark:border-slate-800 overflow-hidden"
 >
 <div className="flex items-center gap-3 px-4 py-3 border-b border-border-color dark:border-slate-800">
 <Command className="h-5 w-5 text-secondary-600" />
 <input
 type="text"
 placeholder="Type a command or search..."
 autoFocus
 value={commandFilter}
 onChange={(e) => setCommandFilter(e.target.value)}
 onKeyDown={(e) => e.key === 'Escape' && setShowCommandPalette(false)}
 className="flex-1 bg-transparent text-sm focus:outline-none text-text-primary placeholder:text-text-muted"
 />
 <button
 onClick={() => setShowCommandPalette(false)}
 className="p-1 rounded-lg hover:bg-bg-tertiary dark:hover:bg-slate-800 text-text-muted"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 <div className="max-h-80 overflow-y-auto p-2">
 <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Quick Actions</div>
 {filteredCommands.length === 0 && (
 <div className="px-3 py-6 text-center text-sm text-text-muted">No commands found</div>
 )}
 {filteredCommands.map((item) => (
 <button
 key={item.label}
 onClick={() => {
 setShowCommandPalette(false);
 navigate(item.action);
 }}
 className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-bg-tertiary dark:hover:bg-slate-800 transition-colors text-left group"
 >
 <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 group-hover:bg-secondary-500/10 group-hover:text-secondary-600">
 <item.icon className="h-4 w-4" />
 </div>
 <div>
 <p className="text-sm font-medium text-text-primary">{item.label}</p>
 <p className="text-xs text-text-muted">{item.description}</p>
 </div>
 </button>
 ))}
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </>
 );
}

function MenuButton({
 icon: Icon,
 label,
 description,
 onClick,
}: {
 icon: React.ComponentType<{ className?: string }>;
 label: string;
 description: string;
 onClick: () => void;
}) {
 return (
 <button
 onClick={onClick}
 className="flex items-start gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-text-primary hover:bg-bg-tertiary dark:hover:bg-slate-800 transition-colors text-left"
 >
 <Icon className="h-4 w-4 mt-0.5 text-text-muted" />
 <div>
 <p className="font-medium">{label}</p>
 <p className="text-xs text-text-muted">{description}</p>
 </div>
 </button>
 );
}
