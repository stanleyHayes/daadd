import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useOrders,
  useOrderAction,
  merchantNextAction,
  formatMinor,
  type Order,
  type OrderStatus,
} from '@/hooks/useCommerce';
import { cn, formatDate } from '@/lib/utils';
import { ShoppingBag, ChevronDown } from 'lucide-react';

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  created: 'bg-bg-secondary text-text-muted dark:bg-slate-700',
  payment_pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  accepted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  preparing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  delivered: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  disputed: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
  refunded: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  cancelled: 'bg-bg-secondary text-text-muted dark:bg-slate-700',
  expired: 'bg-bg-secondary text-text-muted dark:bg-slate-700',
};

export function StatusChip({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', ORDER_STATUS_TONE[status])}>
      {t(`dashboard.orders.status.${status}`)}
    </span>
  );
}

export function OrderCard({ order, children }: { order: Order; children?: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusChip status={order.status} />
            <span className="text-sm font-semibold text-text-primary">{formatMinor(order.total_minor, order.currency)}</span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
          </p>
          <p className="text-xs text-text-muted">{t('dashboard.orders.placed', { date: formatDate(order.created_at) })}</p>
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </div>

      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary">
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} /> {t('dashboard.orders.timeline')}
      </button>
      {open && (
        <ol className="space-y-1 border-l-2 border-border-color pl-3 dark:border-slate-700">
          {order.history.map((h, i) => (
            <li key={i} className="text-xs text-text-secondary">
              <span className="font-medium text-text-primary">{t(`dashboard.orders.status.${h.status}`)}</span>
              {' · '}
              {h.actor}
              {' · '}
              {formatDate(h.at)}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function MerchantOrdersPage() {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useOrders('merchant');
  const act = useOrderAction();

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1000px] space-y-6">
        <PageHeader title={t('dashboard.orders.merchantTitle')} subtitle={t('dashboard.orders.merchantSubtitle')} />
        {isLoading ? (
          <div className="py-12 text-center text-text-muted">{t('dashboard.common.loading')}</div>
        ) : !orders || orders.length === 0 ? (
          <Card shape="soft">
            <EmptyState variant="plain" icon={<ShoppingBag />} title={t('dashboard.orders.emptyMerchantTitle')} description={t('dashboard.orders.emptyMerchantDesc')} />
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const next = merchantNextAction(order.status);
              const canCancel = ['paid', 'accepted'].includes(order.status);
              return (
                <OrderCard key={order.id} order={order}>
                  {next && (
                    <Button size="sm" onClick={() => act.mutate({ id: order.id, action: next })} loading={act.isPending}>
                      {t(`dashboard.orders.action.${next}`)}
                    </Button>
                  )}
                  {canCancel && (
                    <Button size="sm" variant="outline" className="text-danger-600" onClick={() => act.mutate({ id: order.id, action: 'cancel' })}>
                      {t('dashboard.orders.action.cancel')}
                    </Button>
                  )}
                </OrderCard>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
