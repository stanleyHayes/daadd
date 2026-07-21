import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { StreakCard, VipCard, Leaderboard } from '@/components/rewards/Leaderboard';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useRewards, useRewardBalance } from '@/hooks/useRewards';
import { useNotifications } from '@/hooks/useNotifications';
import { useUpdateProfile, useChangePassword } from '@/hooks/useAuth';
import { cn, getInitials, formatDate } from '@/lib/utils';
import {
  User,
  Wallet,
  History,
  Lock,
  LogOut,
  Camera,
  Bell,
  Palette,
  Eye,
  Coins,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const tabs = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'rewards', label: 'Rewards & History', icon: History },
  { key: 'settings', label: 'Settings', icon: Palette },
  { key: 'security', label: 'Security', icon: Lock },
];

const statusStyles: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  paid: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  rejected: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
};

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: rewards, isLoading: rewardsLoading } = useRewards();
  const { data: balance } = useRewardBalance();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [profileForm, setProfileForm] = useState({ name: '', avatar_url: '' });
  const [preferences, setPreferences] = useState<{
    theme: 'light' | 'dark';
    language: string;
    email_notifications: boolean;
  }>({
    theme: theme || 'light',
    language: 'en',
    email_notifications: true,
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, avatar_url: user.avatar_url || '' });
      setPreferences({
        theme: user.preferences?.theme === 'dark' ? 'dark' : 'light',
        language: user.preferences?.language || 'en',
        email_notifications: user.preferences?.email_notifications ?? true,
      });
    }
  }, [user, theme]);

  if (!user) return null;

  const totalEarned = rewards?.reduce((sum, r) => sum + (r.status !== 'rejected' ? r.amount : 0), 0) || 0;
  const pendingAmount = rewards?.reduce((sum, r) => (r.status === 'pending' ? sum + r.amount : sum), 0) || 0;
  const adsViewed = rewards?.length || 0;

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        name: profileForm.name,
        avatar_url: profileForm.avatar_url,
        preferences,
      });
      if (preferences.theme !== theme) setTheme(preferences.theme as 'light' | 'dark');
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });
      toast.success('Password changed');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch {
      toast.error('Failed to change password. Check your current password.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="My Profile"
          subtitle="Manage your account, track ads you have viewed, and control your rewards."
        />

        {/* User hero card */}
        <Card padding={false} className="overflow-hidden">
          <div className="relative bg-primary-700 text-white p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-500/10 rounded-full blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur-sm overflow-hidden">
                  {profileForm.avatar_url ? (
                    <img src={profileForm.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-secondary-500 text-primary-900 flex items-center justify-center shadow-lg hover:bg-secondary-400 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-primary-100">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium capitalize">
                    {user.role.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium">
                    Joined {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white focus:ring-white/40"
                onClick={() => setActiveTab('settings')}
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border-color dark:divide-slate-800">
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-text-muted text-xs mb-1">
                <Eye className="h-3.5 w-3.5" /> Ads Viewed
              </div>
              <p className="text-2xl font-bold text-text-primary">{adsViewed}</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-text-muted text-xs mb-1">
                <Coins className="h-3.5 w-3.5" /> Total Earned
              </div>
              <p className="text-2xl font-bold text-text-primary">${totalEarned.toFixed(2)}</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-text-muted text-xs mb-1">
                <Wallet className="h-3.5 w-3.5" /> Balance
              </div>
              <p className="text-2xl font-bold text-text-primary">${(balance?.balance || 0).toFixed(2)}</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-text-muted text-xs mb-1">
                <Clock className="h-3.5 w-3.5" /> Pending
              </div>
              <p className="text-2xl font-bold text-text-primary">${pendingAmount.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 bg-bg-secondary dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center min-w-[8rem]',
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader title="Recent Activity" subtitle="Your latest ad views, rewards, and account updates" />
              <div className="space-y-3">
                {notificationsLoading ? (
                  <div className="py-8 text-center text-text-muted">Loading activity...</div>
                ) : notifications && notifications.length > 0 ? (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-bg-secondary dark:bg-slate-800/50 border border-border-color dark:border-slate-800"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        n.type === 'reward' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'
                      )}>
                        {n.type === 'reward' ? <Coins className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{n.title}</p>
                        <p className="text-xs text-text-secondary truncate">{n.message}</p>
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap">{formatDate(n.created_at)}</span>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    size="sm"
                    variant="plain"
                    icon={<Bell />}
                    title="No activity yet"
                    description="Your ad views, rewards, and account updates will show up here."
                    actionLabel="Browse Ads"
                    onAction={() => navigate('/ads')}
                  />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Quick Actions" subtitle="Shortcuts to common tasks" />
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/ads')}>
                  <Eye className="h-4 w-4" /> Browse Ads
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('rewards')}>
                  <History className="h-4 w-4" /> View Reward History
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('settings')}>
                  <Palette className="h-4 w-4" /> Edit Preferences
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-danger-600" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Log Out
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Rewards & History */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <StreakCard />
            <VipCard />
            <Card>
            <CardHeader title="Reward History" subtitle="All rewards you have earned from viewing ads" />
            {rewardsLoading ? (
              <div className="py-12 text-center text-text-muted">Loading rewards...</div>
            ) : rewards && rewards.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-color dark:border-slate-800 text-left text-text-muted">
                      <th className="py-3 px-4 font-medium">Ad</th>
                      <th className="py-3 px-4 font-medium">Amount</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.map((reward) => (
                      <tr key={reward.id} className="border-b border-border-color dark:border-slate-800/50 last:border-0">
                        <td className="py-3 px-4 text-text-primary font-medium">
                          {reward.ad_title ||
                            reward.note ||
                            (reward.amount < 0 ? 'Redemption' : 'Reward')}
                        </td>
                        <td className="py-3 px-4 text-text-primary">${reward.amount.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', statusStyles[reward.status] || 'bg-gray-100 text-gray-700')}>
                            {reward.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                            {reward.status === 'pending' && <Clock className="h-3 w-3" />}
                            {reward.status === 'rejected' && <AlertCircle className="h-3 w-3" />}
                            {reward.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-muted">{formatDate(reward.earned_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                variant="plain"
                icon={<Coins />}
                title="No rewards yet"
                description="Start browsing ads to earn your first reward. Every view counts."
                actionLabel="Browse Ads"
                onAction={() => navigate('/ads')}
              />
            )}
            </Card>
            <Leaderboard />
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Profile Information" subtitle="Update your name and avatar" />
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
                <Input
                  label="Avatar URL"
                  value={profileForm.avatar_url}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
                <Input label="Email" type="email" value={user.email} disabled />
              </div>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader title="Preferences" subtitle="Customize your experience" />
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Theme</label>
                  <Select
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      ]}
                    value={preferences.theme}
                    onChange={(value) => setPreferences({ ...preferences, theme: value as 'light' | 'dark' })}
                    fullWidth
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Language</label>
                  <Select
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' },
                      { value: 'pt', label: 'Portuguese' },
                    ]}
                    value={preferences.language}
                    onChange={(value) => setPreferences({ ...preferences, language: value })}
                    fullWidth
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-text-muted" />
                    <span className="text-sm text-text-primary">Email notifications</span>
                  </div>
                  <button
                    onClick={() => setPreferences({ ...preferences, email_notifications: !preferences.email_notifications })}
                    className={cn(
                      'w-11 h-6 rounded-full relative transition-colors',
                      preferences.email_notifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-slate-600'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                      preferences.email_notifications ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
              </div>
              <CardFooter>
                <Button variant="outline" onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Change Password" subtitle="Update your password to keep your account secure" />
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                />
              </div>
              <CardFooter>
                <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader title="Session" subtitle="Sign out of your account on this device" />
              <p className="text-sm text-text-secondary mb-4">
                Logging out will end your current session and require you to sign in again.
              </p>
              <Button variant="danger" className="gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Log Out
              </Button>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
