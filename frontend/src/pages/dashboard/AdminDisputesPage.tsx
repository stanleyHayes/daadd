import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useOrders, useResolveDispute, formatMinor } from '@/hooks/useCommerce';
import { OrderCard } from './MerchantOrdersPage';
import { Scale, RotateCcw, CheckCircle2 } from 'lucide-react';

/** Only allow http(s) evidence links — never a javascript:/data: scheme (XSS). */
function safeHref(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

export function AdminDisputesPage() {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useOrders('admin', 'disputed');
  const resolve = useResolveDispute();

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1000px] space-y-6">
        <PageHeader title={t('dashboard.disputes.title')} subtitle={t('dashboard.disputes.subtitle')} />
        {isLoading ? (
          <div className="py-12 text-center text-text-muted">{t('dashboard.common.loading')}</div>
        ) : !orders || orders.length === 0 ? (
          <Card shape="soft">
            <EmptyState variant="plain" icon={<Scale />} title={t('dashboard.disputes.emptyTitle')} description={t('dashboard.disputes.emptyDesc')} />
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="space-y-2">
                <OrderCard order={order}>
                  <Button size="sm" onClick={() => resolve.mutate({ id: order.id, resolution: 'refunded' })} loading={resolve.isPending}>
                    <RotateCcw className="h-4 w-4" /> {t('dashboard.disputes.refund')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: order.id, resolution: 'released' })} loading={resolve.isPending}>
                    <CheckCircle2 className="h-4 w-4" /> {t('dashboard.disputes.release')}
                  </Button>
                </OrderCard>
                {order.dispute && (
                  <Card className="border-danger-200 bg-danger-50/40 dark:border-danger-900/40 dark:bg-danger-900/10">
                    <p className="text-sm font-semibold text-text-primary">
                      {t('dashboard.disputes.reason')}: {order.dispute.reason}
                    </p>
                    {order.dispute.detail && <p className="mt-1 text-sm text-text-secondary">{order.dispute.detail}</p>}
                    <p className="mt-1 text-xs text-text-muted">
                      {t('dashboard.disputes.value')}: {formatMinor(order.total_minor, order.currency)}
                    </p>
                    {order.dispute.evidence.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {order.dispute.evidence.map((url, i) => {
                          const href = safeHref(url);
                          return href ? (
                            <a key={i} href={href} target="_blank" rel="noreferrer noopener" className="text-xs text-primary-600 underline">
                              {t('dashboard.disputes.evidence')} {i + 1}
                            </a>
                          ) : (
                            <span key={i} className="text-xs text-text-muted">
                              {t('dashboard.disputes.evidence')} {i + 1}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
