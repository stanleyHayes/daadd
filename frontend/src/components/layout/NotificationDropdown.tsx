import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, AlertTriangle, TrendingUp, Megaphone } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';

const typeIcons: Record<string, typeof Bell> = {
  anomaly: AlertTriangle,
  optimization: TrendingUp,
  campaign: Megaphone,
  info: Bell,
};

const typeColors: Record<string, string> = {
  anomaly: 'text-danger-500 bg-danger-50 dark:bg-danger-900/30',
  optimization: 'text-secondary-500 bg-secondary-50 dark:bg-secondary-900/30',
  campaign: 'text-primary-500 bg-primary-50 dark:bg-primary-900/30',
  info: 'text-gray-500 bg-gray-50 dark:bg-slate-700',
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = notifications || [];
  const unreadCount = items.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  const handleClick = (id: string, read: boolean) => {
    if (!read) {
      markRead.mutate(id);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-danger-500 text-white text-[10px] font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg z-20 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700">
                    <Check className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto scrollbar-thin divide-y divide-gray-100 dark:divide-slate-700">
                {isLoading ? (
                  <div className="py-6 px-4">
                    <SkeletonList items={4} />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-slate-400">No notifications</p>
                  </div>
                ) : (
                  items.map((notif) => {
                    const Icon = typeIcons[notif.type] || Bell;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleClick(notif.id, notif.read)}
                        className={cn(
                          'flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer',
                          !notif.read && 'bg-primary-50/30 dark:bg-primary-900/10'
                        )}
                      >
                        <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg shrink-0', typeColors[notif.type] || typeColors.info)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{formatRelativeTime(notif.created_at)}</p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-200 dark:border-slate-700 text-center">
                <button onClick={() => setIsOpen(false)} className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                  View all notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
