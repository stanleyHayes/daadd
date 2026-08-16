import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useMyOrders, formatMinor, type OrderStatus } from '@/hooks/useCommerce';

export const STATUS_TONE: Record<OrderStatus, string> = {
  created: '#94A3B8',
  payment_pending: '#F59E0B',
  paid: '#2563EB',
  accepted: '#2563EB',
  preparing: '#6366F1',
  shipped: '#6366F1',
  delivered: '#14B8A6',
  completed: '#10B981',
  disputed: '#EF4444',
  refunded: '#F97316',
  cancelled: '#94A3B8',
  expired: '#94A3B8',
};

export default function OrdersScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { data: orders, isLoading } = useMyOrders();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : !orders || orders.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: spacing.xxl }}>
          <Ionicons name="receipt-outline" size={44} color={colors.text.tertiary} />
          <Text style={[typography.bodyMedium, { color: colors.text.secondary, marginTop: spacing.sm }]}>{t('mobile.orders.empty')}</Text>
        </View>
      ) : (
        orders.map((o) => (
          <TouchableOpacity key={o.id} onPress={() => router.push(`/order/${o.id}` as Href)}>
            <Card style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.text.primary }]}>
                  {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </Text>
                <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 2 }]}>{formatMinor(o.total_minor, o.currency)}</Text>
              </View>
              <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999, backgroundColor: STATUS_TONE[o.status] + '22' }}>
                <Text style={[typography.caption, { color: STATUS_TONE[o.status] }]}>{t(`mobile.orders.status.${o.status}`)}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
