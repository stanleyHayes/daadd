import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { Plug, AlertTriangle, Globe, ArrowRight, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';

interface PlatformAccount {
  id: string;
  platform: string;
  platform_account_id: string;
  platform_account_name?: string;
  status: 'connected' | 'pending' | 'sync_error' | 'revoked';
  is_active: boolean;
  sync_frequency: 'realtime' | 'hourly' | 'daily';
  last_synced?: Date;
  error_message?: string;
  created_at: Date;
}

const PLATFORMS = [
  { id: 'google', name: 'Google Ads', color: 'bg-[#4285f4]', tone: 'from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900', description: 'Search, display and video campaign performance.' },
  { id: 'meta', name: 'Meta', color: 'bg-[#0866ff]', tone: 'from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900', description: 'Facebook and Instagram campaign intelligence.' },
  { id: 'tiktok', name: 'TikTok', color: 'bg-black', tone: 'from-slate-100 to-white dark:from-slate-800 dark:to-slate-900', description: 'Short-form video reach and engagement data.' },
  { id: 'linkedin', name: 'LinkedIn', color: 'bg-[#0a66c2]', tone: 'from-sky-50 to-white dark:from-sky-950/20 dark:to-slate-900', description: 'Professional audience and B2B campaign reporting.' },
  { id: 'pinterest', name: 'Pinterest', color: 'bg-[#e60023]', tone: 'from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-900', description: 'Discovery, saves and shopping campaign insights.' },
];

export function PlatformAccountsPage() {
  const { t } = useTranslation();
  // Fetch platform accounts
  const { data: accounts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['platform-accounts'],
    queryFn: async () => {
      const response = await api.get('/platform-accounts');
      return response.data as PlatformAccount[];
    },
  });

  // Disconnect account
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await api.delete(`/platform-accounts/${accountId}`);
    },
    onSuccess: () => {
      toast.success(t('dashboard.platformAccounts.disconnected'));
      refetch();
    },
    onError: () => {
      toast.error(t('dashboard.platformAccounts.disconnectFailed'));
    },
  });

  // Test connection
  const testMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await api.post(`/platform-accounts/${accountId}/test`);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('dashboard.platformAccounts.verified'));
      refetch();
    },
    onError: () => {
      toast.error(t('dashboard.platformAccounts.verifyFailed'));
    },
  });

  // Start OAuth flow
  const startOAuth = async (platform: string) => {
    try {
      const response = await api.get(`/oauth/authorize/${platform}`);
      window.location.href = response.data.authorization_url;
    } catch {
      toast.error(`Failed to start ${platform} OAuth flow`);
    }
  };

  const getConnectedPlatforms = () => accounts.map(a => a.platform);
  const connectedPlatforms = getConnectedPlatforms();

  if (isLoading) {
    return (
      <div className="max-w-[1500px] mx-auto space-y-6">
        <PageHeader
          title={t('dashboard.platformAccounts.title')}
          subtitle={t('dashboard.platformAccounts.subtitle')}
        />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1500px] mx-auto space-y-6">
        <PageHeader
          title={t('dashboard.platformAccounts.title')}
          subtitle={t('dashboard.platformAccounts.subtitle')}
        />
        <Card className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{t('dashboard.platformAccounts.loadError')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('dashboard.common.retry')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto space-y-6">
      <PageHeader
        title={t('dashboard.platformAccounts.title')}
        subtitle={t('dashboard.platformAccounts.subtitle')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricsCard icon={<Plug className="h-5 w-5" />} label={t('dashboard.platformAccounts.connected')} value={String(accounts.filter(a => a.status === 'connected').length)} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
        <MetricsCard icon={<AlertTriangle className="h-5 w-5" />} label={t('dashboard.platformAccounts.syncErrors')} value={String(accounts.filter(a => a.status === 'sync_error').length)} iconColor="text-danger-600" iconBg="bg-danger-50 dark:bg-danger-900/30" />
        <MetricsCard icon={<Globe className="h-5 w-5" />} label={t('dashboard.platformAccounts.availablePlatforms')} value={String(PLATFORMS.length)} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="space-y-4">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary-700 dark:text-secondary-300">Active data sources</p><h2 className="mt-1 text-xl font-black tracking-[-0.025em]">{t('dashboard.platformAccounts.connectedAccounts')}</h2></div>
          <div className="grid gap-4">
            {accounts.map(account => {
              const platform = PLATFORMS.find(p => p.id === account.platform);
              return (
                <Card key={account.id} shape="soft" className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-[16px] ${platform?.color || 'bg-gray-500'} flex items-center justify-center text-white font-black shadow-lg`}>
                        {platform?.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{platform?.name}</h3>
                        <p className="text-sm text-gray-600">
                          {account.platform_account_name || account.platform_account_id}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            account.status === 'connected' ? 'bg-green-100 text-green-800' :
                            account.status === 'sync_error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {account.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {account.last_synced && (
                            <span className="text-xs text-gray-500">
                              Last synced: {new Date(account.last_synced).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate(account.id)}
                        disabled={testMutation.isPending}
                      >
                        {testMutation.isPending ? 'Testing...' : 'Test'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => disconnectMutation.mutate(account.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        {t('dashboard.platformAccounts.disconnect')}
                      </Button>
                    </div>
                  </div>
                  {account.error_message && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {account.error_message}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Platforms */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary-700 dark:text-secondary-300">Integration directory</p><h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">{t('dashboard.platformAccounts.connectNew')}</h2></div><p className="max-w-md text-sm text-text-muted">Bring campaign performance into one view. Connections use each platform's secure authorization flow.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
          {PLATFORMS.map(platform => (
            <Card
              key={platform.id}
              shape="soft"
              className={`group relative min-h-64 overflow-hidden bg-gradient-to-br p-6 cursor-pointer transition-all ${platform.tone} ${
                connectedPlatforms.includes(platform.id)
                  ? 'opacity-50'
                  : 'hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(7,20,49,0.11)] hover:border-secondary-400'
              }`}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between"><div className={`w-14 h-14 rounded-[18px] ${platform.color} flex items-center justify-center text-white text-xl font-black shadow-lg`}>{platform.name.charAt(0)}</div>{connectedPlatforms.includes(platform.id) ? <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Connected</span> : <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary-900" />}</div>
                <h3 className="mt-7 text-xl font-black tracking-[-0.03em]">{platform.name}</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">{platform.description}</p>
                <Button
                  shape="pill"
                  className="mt-auto w-full pt-3"
                  onClick={() => startOAuth(platform.id)}
                  disabled={connectedPlatforms.includes(platform.id)}
                  icon={connectedPlatforms.includes(platform.id) ? <CheckCircle2 className="h-4 w-4" /> : <Plug className="h-4 w-4" />}
                >
                  {connectedPlatforms.includes(platform.id) ? 'Connected' : 'Connect'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <Card shape="soft" className="overflow-hidden border-0 bg-[#07142f] p-6 text-white">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary-400 text-primary-900"><ShieldCheck className="h-5 w-5" /></span><div><h3 className="font-bold">{t('dashboard.platformAccounts.howItWorks')}</h3><p className="text-xs text-white/45">Secure connection, clear control.</p></div></div>
        <ul className="mt-5 grid gap-3 text-sm text-white/60 sm:grid-cols-2">
          <li className="flex gap-2"><RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-secondary-300" />{t('dashboard.platformAccounts.how1')}</li>
          <li className="flex gap-2"><RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-secondary-300" />{t('dashboard.platformAccounts.how2')}</li>
          <li className="flex gap-2"><RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-secondary-300" />{t('dashboard.platformAccounts.how3')}</li>
          <li className="flex gap-2"><RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-secondary-300" />{t('dashboard.platformAccounts.how4')}</li>
        </ul>
      </Card>
    </div>
  );
}
