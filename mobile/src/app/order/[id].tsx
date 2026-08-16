import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useOrder, useOrderAction, formatMinor, commerceError } from '@/hooks/useCommerce';
import { STATUS_TONE } from '../orders';

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, refetch } = useOrder(id);
  const act = useOrderAction();

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const run = async (action: 'confirm' | 'cancel' | 'dispute', body?: object) => {
    setError(null);
    try {
      await act.mutateAsync({ id: order.id, action, body });
      setDisputeOpen(false);
      setReason('');
      refetch();
    } catch (e) {
      setError(commerceError(e));
    }
  };

  const canConfirm = order.status === 'delivered';
  const canCancel = order.status === 'created' || order.status === 'payment_pending';
  const canDispute = ['paid', 'accepted', 'preparing', 'shipped', 'delivered'].includes(order.status);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <Text style={[typography.headingMedium, { color: colors.text.primary }]}>{formatMinor(order.total_minor, order.currency)}</Text>
        <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999, backgroundColor: STATUS_TONE[order.status] + '22' }}>
          <Text style={[typography.caption, { color: STATUS_TONE[order.status] }]}>{t(`mobile.orders.status.${order.status}`)}</Text>
        </View>
      </View>

      <Card style={{ marginBottom: spacing.md }}>
        {order.items.map((i, idx) => (
          <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={[typography.bodyMedium, { color: colors.text.primary }]}>{i.quantity}× {i.name}</Text>
            <Text style={[typography.bodyMedium, { color: colors.text.secondary }]}>{formatMinor(i.unit_price_minor * i.quantity, order.currency)}</Text>
          </View>
        ))}
      </Card>

      {/* Timeline */}
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.xs }]}>{t('mobile.orders.timeline')}</Text>
        {order.history.map((h, idx) => (
          <Text key={idx} style={[typography.bodySmall, { color: colors.text.secondary }]}>
            {t(`mobile.orders.status.${h.status}`)} · {h.actor}
          </Text>
        ))}
      </Card>

      {!!error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

      {/* Actions */}
      {canConfirm && <Button title={t('mobile.orders.confirm')} onPress={() => run('confirm')} loading={act.isPending} style={{ marginBottom: spacing.sm }} />}
      {canCancel && <Button variant="outline" title={t('mobile.orders.cancel')} onPress={() => run('cancel')} loading={act.isPending} style={{ marginBottom: spacing.sm }} />}
      {canDispute && !disputeOpen && (
        <Button variant="outline" title={t('mobile.orders.dispute')} onPress={() => setDisputeOpen(true)} style={{ marginBottom: spacing.sm }} />
      )}
      {disputeOpen && (
        <Card>
          <Text style={[typography.caption, { color: colors.text.secondary }]}>{t('mobile.orders.disputeReason')}</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder={t('mobile.orders.disputePlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.xs, color: colors.text.primary }}
          />
          <Button
            title={t('mobile.orders.submitDispute')}
            onPress={() => run('dispute', { reason: reason.trim() || 'unspecified', detail: reason.trim() })}
            loading={act.isPending}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      )}
    </ScrollView>
  );
}
