
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { PageTransition } from '@/components/ui/PageTransition';
import { Plus, Search, Eye, Pencil, Trash2, Megaphone, Copy, CheckCircle2, PauseCircle, Clock } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils';
import { useCampaigns, useDeleteCampaign } from '@/hooks/useCampaigns';
import { useCampaignClone } from '@/hooks/useCampaignClone';
import { INDUSTRIES, CAMPAIGN_STATUSES, INDUSTRY_COLOR_MAP } from '@/lib/constants';
import { hasPermission } from '@/lib/rbac';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';
import type { CampaignStatus, Industry } from '@/types';

export function CampaignsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'end_user';
  const canCreate = hasPermission(userRole, 'CAMPAIGN_CREATE');
  const canEdit = hasPermission(userRole, 'CAMPAIGN_EDIT');
  const canDelete = hasPermission(userRole, 'CAMPAIGN_DELETE');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
      setPage(1);
    }
  }, [searchParams]);

  const { data: campaignsData, isLoading, error } = useCampaigns({
    status: statusFilter as CampaignStatus,
    industry: industryFilter as Industry | undefined,
    search: searchQuery,
    page,
    limit: perPage,
  });
  const deleteMutation = useDeleteCampaign();
  const cloneMutation = useCampaignClone();

  const campaigns = campaignsData?.data || [];
  const pagination = campaignsData?.pagination;
  const totalPages = pagination?.totalPages || 0;

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('dashboard.campaigns.deleted'));
    } catch {
      toast.error(t('dashboard.campaigns.deleteFailed'));
    }
  };

  const handleClone = async (id: string, name: string) => {
    try {
      const _cloned = await cloneMutation.mutateAsync(id);
      toast.success(`Campaign "${name}" cloned successfully`);
    } catch {
      toast.error(t('dashboard.campaigns.cloneFailed'));
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title={t('dashboard.campaigns.title')}
          subtitle={t('dashboard.campaigns.subtitle')}
          action={
            canCreate && (
              <Link to="/dashboard/campaigns/new">
                <Button icon={<Plus className="h-4 w-4" />}>{t('dashboard.campaigns.create')}</Button>
              </Link>
            )
          }
        />

        {campaignsData && !isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard icon={<Megaphone className="h-5 w-5" />} label={t('dashboard.campaigns.total')} value={String(campaignsData.pagination?.total ?? campaigns.length)} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
            <MetricsCard icon={<CheckCircle2 className="h-5 w-5" />} label={t('dashboard.status.active')} value={String(campaigns.filter(c => c.status === 'active').length)} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
            <MetricsCard icon={<PauseCircle className="h-5 w-5" />} label={t('dashboard.status.paused')} value={String(campaigns.filter(c => c.status === 'paused').length)} iconColor="text-warning-600" iconBg="bg-warning-50 dark:bg-warning-900/30" />
            <MetricsCard icon={<Clock className="h-5 w-5" />} label={t('dashboard.status.completed')} value={String(campaigns.filter(c => c.status === 'completed').length)} iconColor="text-secondary-600" iconBg="bg-secondary-50 dark:bg-secondary-900/30" />
          </div>
        )}

        <Card>
          {isLoading ? (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <SkeletonCard className="h-10 flex-1" />
                <SkeletonCard className="h-10 w-40" />
                <SkeletonCard className="h-10 w-48" />
              </div>
              <SkeletonTable rows={8} columns={8} />
            </>
          ) : error ? (
            <div className="text-center py-12">
              <Megaphone className="h-10 w-10 text-danger-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('dashboard.campaigns.loadError')}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('dashboard.campaigns.loadErrorHint')}</p>
            </div>
          ) : (
          <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input placeholder={t('dashboard.campaigns.searchPlaceholder')} leftIcon={<Search className="h-4 w-4" />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select options={[{ value: '', label: t('dashboard.campaigns.allStatuses') }, ...CAMPAIGN_STATUSES.map((s) => ({ value: s.value, label: s.label }))]} value={statusFilter} onChange={setStatusFilter} className="w-40" />
            <Select options={[{ value: '', label: t('dashboard.campaigns.allIndustries') }, ...INDUSTRIES.map((i) => ({ value: i.value, label: i.label }))]} value={industryFilter} onChange={setIndustryFilter} className="w-48" />
          </div>

          {campaigns.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-12 w-12" />} title={t('dashboard.campaigns.empty')} description={canCreate ? t('dashboard.campaigns.emptyDescCreate') : t('dashboard.campaigns.emptyDescView')} actionLabel={canCreate ? t('dashboard.campaigns.create') : undefined} onAction={canCreate ? () => navigate('/dashboard/campaigns/new') : undefined} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{t('dashboard.common.name')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{t('dashboard.common.industry')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{t('dashboard.common.status')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{t('dashboard.common.budget')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{t('dashboard.campaigns.start')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">End</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">CTR</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{t('dashboard.common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          <Link to={`/dashboard/campaigns/${c.id}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{c.name}</Link>
                        </td>
                        <td className="px-4 py-3"><Badge variant={(INDUSTRY_COLOR_MAP[c.industry] || 'gray') as BadgeVariant} size="sm">{c.industry.replace('_', ' ')}</Badge></td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3">
                          <div className="w-32">
                            <ProgressBar value={c.budget_spent} max={c.budget_total} size="sm" showPercentage />
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{formatCurrency(c.budget_spent)} / {formatCurrency(c.budget_total)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{formatDate(c.start_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{formatDate(c.end_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-200 font-medium">{(c.ctr ?? 0) > 0 ? formatPercentage(c.ctr!) : '--'}</td>
                        <td className="px-4 py-3">
                          <Dropdown items={[
                            { key: 'view', label: t('dashboard.campaigns.view'), icon: <Eye className="h-4 w-4 text-gray-400" />, onClick: () => navigate(`/dashboard/campaigns/${c.id}`) },
                            ...(canEdit ? [{ key: 'edit', label: t('dashboard.campaigns.edit'), icon: <Pencil className="h-4 w-4 text-gray-400" />, onClick: () => navigate(`/dashboard/campaigns/${c.id}/edit`) }] : []),
                            { key: 'clone', label: t('dashboard.campaigns.clone'), icon: <Copy className="h-4 w-4 text-gray-400" />, onClick: () => handleClone(c.id, c.name) },
                            ...(canDelete ? [
                              { key: 'divider', label: '', divider: true },
                              { key: 'delete', label: t('dashboard.campaigns.delete'), icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => handleDelete(c.id) },
                            ] : []),
                          ]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-slate-400">{t('dashboard.campaigns.itemsPerPage')}</span>
                    <Select
                      options={[
                        { value: '5', label: '5' },
                        { value: '10', label: '10' },
                        { value: '25', label: '25' },
                      ]}
                      value={String(perPage)}
                      onChange={(v) => { setPerPage(Number(v)); setPage(1); }}
                      size="sm"
                      fullWidth={false}
                      className="w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-300 disabled:opacity-50">{t('dashboard.campaigns.prev')}</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-sm rounded-lg ${p === page ? 'bg-primary-600 text-white' : 'border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-300'}`}>{p}</button>
                    ))}
                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-300 disabled:opacity-50">{t('dashboard.campaigns.next')}</button>
                  </div>
                </div>
              )}
            </>
          )}
          </>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
