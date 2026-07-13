import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { getInitials } from '@/lib/utils';
import { ROLE_NAV_ITEMS } from '@/lib/rbac';
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
  Settings,
  User,
  Plug,
  ChevronLeft,
  ChevronRight,
  Zap,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const allNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ key: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Campaigns',
    items: [
      { key: 'campaigns', href: '/dashboard/campaigns', label: 'Campaigns', icon: Megaphone },
      { key: 'ai-optimization', href: '/dashboard/ai-optimization', label: 'AI Optimization', icon: Brain },
      { key: 'anomalies', href: '/dashboard/anomalies', label: 'Anomalies', icon: AlertTriangle },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { key: 'analytics', href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { key: 'heatmaps', href: '/dashboard/heatmaps', label: 'Heatmaps', icon: Map },
      { key: 'benchmarking', href: '/dashboard/benchmarking', label: 'Benchmarking', icon: TrendingUp },
      { key: 'storyteller', href: '/dashboard/storyteller', label: 'Storyteller', icon: BookOpen },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { key: 'team', href: '/dashboard/team', label: 'Team', icon: Users },
      { key: 'platform-accounts', href: '/dashboard/platform-accounts', label: 'Ad Accounts', icon: Plug },
      { key: 'profile', href: '/dashboard/profile', label: 'My Profile', icon: User },
      { key: 'settings', href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = (user?.role || 'end_user') as UserRole;
  const allowedKeys = ROLE_NAV_ITEMS[userRole] || [];

  const visibleGroups = allNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowedKeys.includes(item.key)),
    }))
    .filter((group) => group.items.length > 0);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-[72px] border-b border-white/10 shrink-0 bg-gradient-to-r from-primary-800 to-primary-900">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary-500 shrink-0 shadow-lg shadow-secondary-500/25 ring-2 ring-secondary-500/20">
          <Zap className="h-5 w-5 text-primary-900" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white tracking-tight">AdPlatform</span>
            <span className="text-[10px] text-secondary-300 uppercase tracking-[0.15em] font-semibold">Workspace</span>
          </div>
        )}
      </div>

      {/* Gold hairline */}
      <div className="gold-hairline w-full" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2">
        <div className="space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-secondary-400/80">
                  {group.title}
                </p>
              )}
              {collapsed && <div className="mx-auto w-6 border-t border-white/10 mb-3" />}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? location.pathname === '/dashboard'
                      : location.pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative',
                          isActive
                            ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                            : 'text-white/70 hover:bg-white/5 hover:text-white',
                          collapsed && 'justify-center px-2'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        {isActive && !collapsed && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-secondary-500 rounded-r-full"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        {isActive && collapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-secondary-500 rounded-r-full" />
                        )}
                        <Icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0 transition-colors',
                            isActive ? 'text-secondary-400' : 'text-white/50 group-hover:text-secondary-300'
                          )}
                        />
                        {!collapsed && item.label}
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
            className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors"
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
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full p-2 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-colors"
          title={collapsed ? 'Expand' : 'Collapse'}
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
        style={{ width: collapsed ? 76 : 264 }}
        className="fixed left-0 top-0 h-screen bg-gradient-to-b from-primary-800 to-primary-900 dark:from-primary-900 dark:to-slate-950 z-30 hidden md:flex flex-col shadow-2xl shadow-primary-950/40 border-r border-white/5"
      >
        {sidebarContent}
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-primary-700 text-white shadow-lg"
        aria-label="Open menu"
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
              className="md:hidden fixed left-0 top-0 h-screen w-[264px] bg-gradient-to-b from-primary-800 to-primary-900 dark:from-primary-900 dark:to-slate-950 z-50 flex flex-col shadow-2xl border-r border-white/5"
            >
              <div className="flex items-center justify-between px-4 h-[72px] border-b border-white/10 bg-gradient-to-r from-primary-800 to-primary-900">
                <span className="text-lg font-bold text-white tracking-tight">AdPlatform</span>
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
