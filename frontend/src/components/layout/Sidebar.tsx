import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/stores/auth.store';
import { getInitials } from '@/lib/utils';
import { ROLE_NAV_ITEMS } from '@/lib/rbac';
import { NAV_ENTRIES, NAV_GROUPS } from '@/lib/navigation';
import type { UserRole } from '@/types';
import {
  LayoutDashboard,
  Megaphone,
  BarChart3,
  Map,
  Brain,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Users,
  MessageSquare,
  Store,
  MapPin,
  Settings,
  User,
  Plug,
  UserCheck,
  ShieldCheck,
  Sparkles,
  LayoutTemplate,
  KeyRound,
  Radio,
  ChevronLeft,
  ChevronRight,
  Zap,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

/** Icons stay here; everything else comes from the shared navigation map. */
const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  campaigns: Megaphone,
  channels: Radio,
  'ai-optimization': Brain,
  anomalies: AlertTriangle,
  analytics: BarChart3,
  heatmaps: Map,
  benchmarking: TrendingUp,
  storyteller: BookOpen,
  messages: MessageSquare,
  merchant: Store,
  outlets: MapPin,
  team: Users,
  'platform-accounts': Plug,
  profile: User,
  settings: Settings,
  'admin-advertisers': UserCheck,
  'admin-moderation': ShieldCheck,
  'admin-loyalty': Sparkles,
  'site-content': LayoutTemplate,
  'roles-access': KeyRound,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = (user?.role || 'end_user') as UserRole;
  const allowedKeys = ROLE_NAV_ITEMS[userRole] || [];
  const { can, isResolved, permissions } = usePermissions();

  // Two gates. The coarse account type decides which nav items exist at all,
  // and the permission set decides which of those this person can actually
  // open. Staff accounts carry permissions; consumer accounts do not, so they
  // fall back to the role map alone rather than losing their whole sidebar.
  const usesPermissions = isResolved && permissions.length > 0;
  const visibleGroups = NAV_GROUPS.map((title) => ({
    title,
    items: NAV_ENTRIES.filter(
      (item) =>
        item.group === title &&
        allowedKeys.includes(item.key) &&
        (!usesPermissions || !item.resource || can(item.resource, 'read'))
    ),
  })).filter((group) => group.items.length > 0);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-[84px] border-b border-white/[0.07] shrink-0">
        <div className="relative flex items-center justify-center w-11 h-11 overflow-hidden rounded-[15px] bg-white shrink-0 shadow-lg shadow-black/20">
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-secondary-400" />
          <Zap className="relative h-5 w-5 fill-primary-900 text-primary-900" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-black text-white tracking-[-0.04em]">SmartAd<span className="text-secondary-400">Deals</span></span>
            <span className="mt-0.5 text-[9px] text-white/35 uppercase tracking-[0.18em] font-bold">{t('dashboard.nav.workspaceLabel')}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-5 px-3">
        <div className="space-y-7">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <p className="px-3 mb-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                  {t(`dashboard.nav.${group.title}`)}
                </p>
              )}
              {collapsed && <div className="mx-auto w-6 border-t border-white/10 mb-3" />}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? location.pathname === '/dashboard'
                      : location.pathname.startsWith(item.href);
                  const Icon = NAV_ICONS[item.key] ?? LayoutDashboard;
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'group flex items-center gap-3 px-3 py-3 rounded-[14px] text-sm font-semibold transition-all duration-200 relative',
                          isActive
                            ? 'bg-secondary-400 text-primary-900 shadow-[0_10px_24px_rgba(244,194,13,0.14)]'
                            : 'text-white/70 hover:bg-white/5 hover:text-white',
                          collapsed && 'justify-center px-2'
                        )}
                        title={collapsed ? t(`dashboard.nav.${item.label}`) : undefined}
                      >
                        {isActive && !collapsed && <motion.div layoutId="sidebar-active-pill" className="absolute inset-0 -z-10 rounded-[14px]" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                        {isActive && collapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-secondary-500 rounded-r-full" />
                        )}
                        <Icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0 transition-colors',
                            isActive ? 'text-primary-900' : 'text-white/45 group-hover:text-secondary-300'
                          )}
                        />
                        {!collapsed && t(`dashboard.nav.${item.label}`)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* User */}
      {!collapsed && user && (
        <div className="px-3 py-4 border-t border-white/10 shrink-0">
          <Link
            to="/dashboard/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-2.5 py-2.5 rounded-2xl bg-white/[0.045] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/10 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-secondary-400 flex items-center justify-center text-primary-900 text-xs font-bold shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-white/50 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="mt-2 flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-danger-300 hover:bg-danger-500/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> {t('dashboard.nav.logOut')}
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-white/[0.07] shrink-0">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full p-2 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-colors"
          title={collapsed ? t('dashboard.nav.expand') : t('dashboard.nav.collapse')}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        style={{ width: collapsed ? 84 : 286 }}
        className="fixed left-0 top-0 h-screen bg-[#07142f] z-30 hidden md:flex flex-col shadow-[18px_0_60px_rgba(7,20,49,0.13)] border-r border-white/[0.06]"
      >
        {sidebarContent}
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-primary-700 text-white shadow-lg"
        aria-label={t('dashboard.nav.openMenu')}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 h-screen w-[286px] bg-[#07142f] z-50 flex flex-col shadow-2xl border-r border-white/5"
            >
              <div className="flex items-center justify-between px-4 h-[84px] border-b border-white/10">
                <span className="text-lg font-bold text-white tracking-tight">SmartAdDeals</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-white/70 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
