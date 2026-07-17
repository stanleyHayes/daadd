import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { Plug, AlertTriangle, Globe } from 'lucide-react';

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
  { id: 'google', name: 'Google Ads', color: 'bg-blue-500' },
  { id: 'meta', name: 'Meta (Facebook/Instagram)', color: 'bg-blue-600' },
  { id: 'tiktok', name: 'TikTok', color: 'bg-black' },
  { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
  { id: 'pinterest', name: 'Pinterest', color: 'bg-red-500' },
];

export function PlatformAccountsPage() {
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
      toast.success('Platform account disconnected');
      refetch();
    },
    onError: () => {
      toast.error('Failed to disconnect account');
    },
  });

  // Test connection
  const testMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await api.post(`/platform-accounts/${accountId}/test`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Connection verified');
      refetch();
    },
    onError: () => {
      toast.error('Connection failed');
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
      <div className="space-y-6">
        <PageHeader
          title="Platform Accounts"
          subtitle="Connect your ad platform accounts to enable metrics sync"
        />
        <LoadingSpinner size="lg" className="py-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform Accounts"
          subtitle="Connect your ad platform accounts to enable metrics sync"
        />
        <Card className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Failed to load platform accounts.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Accounts"
        subtitle="Connect your ad platform accounts to enable metrics sync"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricsCard icon={<Plug className="h-5 w-5" />} label="Connected" value={String(accounts.filter(a => a.status === 'connected').length)} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
        <MetricsCard icon={<AlertTriangle className="h-5 w-5" />} label="Sync Errors" value={String(accounts.filter(a => a.status === 'sync_error').length)} iconColor="text-danger-600" iconBg="bg-danger-50 dark:bg-danger-900/30" />
        <MetricsCard icon={<Globe className="h-5 w-5" />} label="Available Platforms" value={String(PLATFORMS.length)} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Connected Accounts</h2>
          <div className="grid gap-4">
            {accounts.map(account => {
              const platform = PLATFORMS.find(p => p.id === account.platform);
              return (
                <Card key={account.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg ${platform?.color || 'bg-gray-500'} flex items-center justify-center text-white font-bold`}>
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
                        Disconnect
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
        <h2 className="text-xl font-semibold">Connect New Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map(platform => (
            <Card
              key={platform.id}
              className={`p-6 cursor-pointer transition-all ${
                connectedPlatforms.includes(platform.id)
                  ? 'opacity-50'
                  : 'hover:shadow-lg hover:border-blue-500'
              }`}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-16 h-16 rounded-lg ${platform.color} flex items-center justify-center text-white text-2xl font-bold`}>
                  {platform.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-center">{platform.name}</h3>
                <Button
                  className="w-full"
                  onClick={() => startOAuth(platform.id)}
                  disabled={connectedPlatforms.includes(platform.id)}
                >
                  {connectedPlatforms.includes(platform.id) ? 'Connected' : 'Connect'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Click "Connect" on any platform to authorize access to your account</li>
          <li>Your access tokens are encrypted and stored securely</li>
          <li>Metrics are synced automatically based on your selected frequency</li>
          <li>Use the "Test" button to verify your connection at any time</li>
        </ul>
      </Card>
    </div>
  );
}
