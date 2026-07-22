import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '@/i18n/config';
import { Card, CardHeader, CardFooter } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useUpdateProfile, useChangePassword } from '@/hooks/useAuth';
import { cn, getInitials } from '@/lib/utils';
import { Camera, User, Bell, Lock, Palette, Globe, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageTransition } from '@/components/ui/PageTransition';

const STORAGE_KEY_NOTIFICATIONS = 'daadd_notification_prefs';
const STORAGE_KEY_PREFERENCES = 'daadd_user_prefs';

function loadFromStorage<T>(key: string, defaults: T): T {
 try {
 const stored = localStorage.getItem(key);
 return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
 } catch {
 return defaults;
 }
}

// Labels come from `dashboard.settings.tabs`, keyed by `key`.
const tabs = [
 { key: 'profile', icon: User },
 { key: 'preferences', icon: Palette },
 { key: 'notifications', icon: Bell },
 { key: 'security', icon: Lock },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
 return (
 <div
 className={cn('w-11 h-6 rounded-full relative cursor-pointer transition-colors', checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-slate-600')}
 onClick={onChange}
 >
 <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
 </div>
 );
}

const defaultNotifications = {
 email: true,
 anomaly: true,
 team: true,
 weekly: false,
 ai_recommendations: true,
 budget_alerts: true,
 campaign_status: true,
 reward_earned: false,
};

const defaultPreferences = {
 language: 'en',
 timezone: 'America/New_York',
 currency: 'USD',
 dateFormat: 'MMM d, yyyy',
 compactNumbers: true,
 animationsEnabled: true,
 autoRefreshDashboard: true,
 refreshInterval: '30',
};

export function SettingsPage() {
  const { t, i18n } = useTranslation();
 const user = useAuthStore((s) => s.user);
 const { theme, setTheme } = useThemeStore();
 const [activeTab, setActiveTab] = useState('profile');
 const updateProfileMutation = useUpdateProfile();
 const changePasswordMutation = useChangePassword();

 const [profileForm, setProfileForm] = useState({
 name: user?.name || '',
 email: user?.email || '',
 });
 const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
 const [notifications, setNotifications] = useState(() => loadFromStorage(STORAGE_KEY_NOTIFICATIONS, defaultNotifications));
 const [preferences, setPreferences] = useState(() => loadFromStorage(STORAGE_KEY_PREFERENCES, defaultPreferences));

 useEffect(() => {
 if (user) {
 setProfileForm({ name: user.name, email: user.email });
 }
 }, [user]);

 const toggleNotif = (key: string) => {
 setNotifications((prev) => {
 const updated = { ...prev, [key]: !prev[key as keyof typeof prev] };
 localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
 return updated;
 });
 };

 const savePreferences = () => {
 localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(preferences));
 // The picker only stored a string before; actually switch the UI language.
 if (preferences.language !== i18n.resolvedLanguage) i18n.changeLanguage(preferences.language);
 toast.success(t('dashboard.settings.preferencesSaved'));
 };

 const handleSaveProfile = async () => {
 if (!user) return;
 try {
 await updateProfileMutation.mutateAsync({ name: profileForm.name });
 toast.success(t('dashboard.profile.updated'));
 } catch {
 toast.error(t('dashboard.profile.updateFailed'));
 }
 };

 const handleChangePassword = async () => {
 if (passwordForm.new !== passwordForm.confirm) {
 toast.error(t('dashboard.profile.passwordsMismatch'));
 return;
 }
 if (passwordForm.new.length < 8) {
 toast.error(t('dashboard.profile.passwordMin8'));
 return;
 }
 try {
 await changePasswordMutation.mutateAsync({ currentPassword: passwordForm.current, newPassword: passwordForm.new });
 toast.success(t('dashboard.profile.passwordChanged'));
 setPasswordForm({ current: '', new: '', confirm: '' });
 } catch {
 toast.error(t('dashboard.profile.passwordFailed'));
 }
 };

 return (
 <PageTransition>
 <div className="max-w-7xl mx-auto space-y-6">
 <PageHeader
 title={t('dashboard.settings.title')}
 subtitle={t('dashboard.settings.subtitle')}
 />

 {/* Tab bar */}
 <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
 {tabs.map((tab) => {
 const Icon = tab.icon;
 return (
 <button
 key={tab.key}
 onClick={() => setActiveTab(tab.key)}
 className={cn(
 'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
 activeTab === tab.key
 ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
 : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
 )}
 >
 <Icon className="h-4 w-4" />
 <span className="hidden sm:inline">{t(`dashboard.settings.tabs.${tab.key}`)}</span>
 </button>
 );
 })}
 </div>

 {/* Profile Tab */}
 {activeTab === 'profile' && (
 <div className="space-y-6">
 <Card>
 <CardHeader title={t('dashboard.settings.infoTitle')} subtitle={t('dashboard.settings.infoSubtitle')} />
 <div className="flex items-center gap-6 mb-6">
 <div className="relative">
 <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
 {user ? getInitials(user.name) : 'U'}
 </div>
 <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 shadow-sm flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
 <Camera className="h-4 w-4" />
 </button>
 </div>
 <div>
 <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
 <p className="text-sm text-gray-500 dark:text-slate-400">{user?.email}</p>
 <span className="inline-block mt-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input label={t('dashboard.settings.fullName')} value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
 <Input label={t('dashboard.common.email')} type="email" value={profileForm.email} disabled hint={t('dashboard.settings.emailImmutable')} />
 </div>
 <CardFooter>
 <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
 {updateProfileMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('dashboard.common.saving')}</> : 'Save Changes'}
 </Button>
 </CardFooter>
 </Card>
 </div>
 )}

 {/* Preferences Tab */}
 {activeTab === 'preferences' && (
 <div className="space-y-6">
 <Card>
 <CardHeader title={t('dashboard.settings.appearanceTitle')} subtitle={t('dashboard.settings.appearanceSubtitle')} />
 <div className="space-y-5">
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('dashboard.settings.theme')}</label>
 <div className="flex gap-3">
 {(['light', 'dark'] as const).map((t) => (
 <button
 key={t}
 onClick={() => setTheme(t)}
 className={cn(
 'flex-1 p-4 rounded-xl border-2 text-center transition-all',
 theme === t
 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20'
 : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-500'
 )}
 >
 <div className={cn('w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center', t === 'light' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-700 text-slate-300')}>
 {t === 'light' ? '☀️' : '🌙'}
 </div>
 <p className="text-sm font-medium text-gray-700 dark:text-slate-300 capitalize">{t}</p>
 </button>
 ))}
 </div>
 </div>
 <div className="flex items-center justify-between py-2">
 <div>
 <p className="text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.settings.animations')}</p>
 <p className="text-xs text-gray-500 dark:text-slate-400">{t('dashboard.settings.animationsHint')}</p>
 </div>
 <Toggle checked={preferences.animationsEnabled} onChange={() => setPreferences({ ...preferences, animationsEnabled: !preferences.animationsEnabled })} />
 </div>
 <div className="flex items-center justify-between py-2">
 <div>
 <p className="text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.settings.compactNumbers')}</p>
 <p className="text-xs text-gray-500 dark:text-slate-400">{t('dashboard.settings.compactNumbersHint')}</p>
 </div>
 <Toggle checked={preferences.compactNumbers} onChange={() => setPreferences({ ...preferences, compactNumbers: !preferences.compactNumbers })} />
 </div>
 </div>
 </Card>

 <Card>
 <CardHeader title={t('dashboard.settings.regionalTitle')} subtitle={t('dashboard.settings.regionalSubtitle')} />
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Select
 label={t('dashboard.settings.language')}
 leftIcon={<Globe className="h-3.5 w-3.5" />}
 options={Object.entries(languages).map(([code, { name }]) => ({ value: code, label: name }))}
 value={preferences.language}
 onChange={(v) => setPreferences({ ...preferences, language: v })}
 />
 <Select
 label={t('dashboard.settings.timezone')}
 leftIcon={<Clock className="h-3.5 w-3.5" />}
 options={[
 { value: 'America/New_York', label: 'Eastern Time (ET)' },
 { value: 'America/Chicago', label: 'Central Time (CT)' },
 { value: 'America/Denver', label: 'Mountain Time (MT)' },
 { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
 { value: 'Europe/London', label: 'GMT (London)' },
 { value: 'Europe/Paris', label: 'CET (Paris)' },
 { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
 { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
 { value: 'Africa/Lagos', label: 'WAT (Lagos)' },
 { value: 'Africa/Accra', label: 'GMT (Accra)' },
 ]}
 value={preferences.timezone}
 onChange={(v) => setPreferences({ ...preferences, timezone: v })}
 />
 <Select
 label={t('dashboard.settings.currency')}
 options={[
 { value: 'USD', label: 'USD ($)' },
 { value: 'EUR', label: 'EUR (€)' },
 { value: 'GBP', label: 'GBP (£)' },
 { value: 'NGN', label: 'NGN (₦)' },
 { value: 'GHS', label: 'GHS (₵)' },
 { value: 'JPY', label: 'JPY (¥)' },
 ]}
 value={preferences.currency}
 onChange={(v) => setPreferences({ ...preferences, currency: v })}
 />
 <Select
 label={t('dashboard.settings.dateFormat')}
 options={[
 { value: 'MMM d, yyyy', label: 'Mar 15, 2026' },
 { value: 'dd/MM/yyyy', label: '15/03/2026' },
 { value: 'MM/dd/yyyy', label: '03/15/2026' },
 { value: 'yyyy-MM-dd', label: '2026-03-15' },
 ]}
 value={preferences.dateFormat}
 onChange={(v) => setPreferences({ ...preferences, dateFormat: v })}
 />
 </div>
 <CardFooter>
 <Button onClick={savePreferences}>{t('dashboard.settings.savePreferences')}</Button>
 </CardFooter>
 </Card>

 <Card>
 <CardHeader title={t('dashboard.settings.dashboardTitle')} subtitle={t('dashboard.settings.dashboardSubtitle')} />
 <div className="space-y-4">
 <div className="flex items-center justify-between py-2">
 <div>
 <p className="text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.settings.autoRefresh')}</p>
 <p className="text-xs text-gray-500 dark:text-slate-400">{t('dashboard.settings.autoRefreshHint')}</p>
 </div>
 <Toggle checked={preferences.autoRefreshDashboard} onChange={() => setPreferences({ ...preferences, autoRefreshDashboard: !preferences.autoRefreshDashboard })} />
 </div>
 {preferences.autoRefreshDashboard && (
 <div className="w-48">
 <Select
 label={t('dashboard.settings.refreshInterval')}
 options={[
 { value: '15', label: t('dashboard.settings.intervals.s15') },
 { value: '30', label: t('dashboard.settings.intervals.s30') },
 { value: '60', label: t('dashboard.settings.intervals.m1') },
 { value: '300', label: t('dashboard.settings.intervals.m5') },
 ]}
 value={preferences.refreshInterval}
 onChange={(v) => setPreferences({ ...preferences, refreshInterval: v })}
 />
 </div>
 )}
 </div>
 </Card>
 </div>
 )}

 {/* Notifications Tab */}
 {activeTab === 'notifications' && (
 <div className="space-y-6">
 <Card>
 <CardHeader title={t('dashboard.settings.campaignAlerts')} subtitle={t('dashboard.settings.campaignAlertsSubtitle')} />
 <div className="space-y-1 divide-y divide-gray-100 dark:divide-slate-700">
 {[
 { key: 'anomaly', i18n: 'anomaly' },
 { key: 'ai_recommendations', i18n: 'ai' },
 { key: 'budget_alerts', i18n: 'budget' },
 { key: 'campaign_status', i18n: 'campaignStatus' },
 ].map((item) => (
 <div key={item.key} className="flex items-center justify-between py-3">
 <div>
 <p className="text-sm font-medium text-gray-900 dark:text-white">{t(`dashboard.settings.alerts.${item.i18n}`)}</p>
 <p className="text-xs text-gray-500 dark:text-slate-400">{t(`dashboard.settings.alerts.${item.i18n}Desc`)}</p>
 </div>
 <Toggle checked={notifications[item.key as keyof typeof notifications]} onChange={() => toggleNotif(item.key)} />
 </div>
 ))}
 </div>
 </Card>

 <Card>
 <CardHeader title={t('dashboard.settings.generalNotifications')} subtitle={t('dashboard.settings.generalNotificationsSubtitle')} />
 <div className="space-y-1 divide-y divide-gray-100 dark:divide-slate-700">
 {[
 { key: 'email', i18n: 'email' },
 { key: 'team', i18n: 'team' },
 { key: 'weekly', i18n: 'weekly' },
 { key: 'reward_earned', i18n: 'reward' },
 ].map((item) => (
 <div key={item.key} className="flex items-center justify-between py-3">
 <div>
 <p className="text-sm font-medium text-gray-900 dark:text-white">{t(`dashboard.settings.alerts.${item.i18n}`)}</p>
 <p className="text-xs text-gray-500 dark:text-slate-400">{t(`dashboard.settings.alerts.${item.i18n}Desc`)}</p>
 </div>
 <Toggle checked={notifications[item.key as keyof typeof notifications]} onChange={() => toggleNotif(item.key)} />
 </div>
 ))}
 </div>
 </Card>
 </div>
 )}

 {/* Security Tab */}
 {activeTab === 'security' && (
 <div className="space-y-6">
 <Card>
 <CardHeader title={t('dashboard.settings.passwordTitle')} subtitle={t('dashboard.settings.passwordSubtitle')} />
 <div className="space-y-4 max-w-md">
 <Input label={t('dashboard.settings.currentPassword')} type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
 <Input label={t('dashboard.settings.newPassword')} type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} />
 <Input label={t('dashboard.settings.confirmNewPassword')} type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
 </div>
 <CardFooter>
 <Button
 onClick={handleChangePassword}
 disabled={changePasswordMutation.isPending || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
 >
 {changePasswordMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('dashboard.settings.changing')}</> : 'Change Password'}
 </Button>
 </CardFooter>
 </Card>

 <Card>
 <CardHeader title={t('dashboard.settings.dangerZone')} />
 <div className="flex items-center justify-between p-4 rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/10">
 <div>
 <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{t('dashboard.settings.deleteAccount')}</p>
 <p className="text-xs text-danger-600 dark:text-danger-500">{t('dashboard.settings.deleteAccountHint')}</p>
 </div>
 <Button variant="danger" size="sm" onClick={() => toast.error(t('dashboard.settings.deleteRequiresEmail'))}>
 {t('dashboard.settings.deleteAccount')}
 </Button>
 </div>
 </Card>
 </div>
 )}
 </div>
 </PageTransition>
 );
}
