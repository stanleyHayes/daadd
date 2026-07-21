import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePurchaseHistory, PurchaseRecord } from '@/hooks/usePurchaseHistory';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';

export default function PurchasesScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: purchases = [], isLoading } = usePurchaseHistory();

  const renderItem = ({ item }: { item: PurchaseRecord }) => (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.text.primary, fontFamily: fontFamily.semibold }]}>
            {item.merchant}
          </Text>
          {!!item.outlet && (
            <Text numberOfLines={1} style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 2 }]}>
              <Ionicons name="location-outline" size={12} /> {item.outlet.name}
              {item.outlet.city ? `, ${item.outlet.city}` : ''}
            </Text>
          )}
          <Text style={[typography.caption, { color: colors.text.tertiary, marginTop: 2 }]}>
            {new Date(item.date).toLocaleDateString()} ·{' '}
            {new Date(item.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[typography.headingSmall, { color: colors.text.primary }]}>
            ${item.final_amount.toFixed(2)}
          </Text>
          {item.discount_amount > 0 && (
            <Text style={[typography.caption, { color: colors.accent }]}>
              −${item.discount_amount.toFixed(2)} ({item.tokens} {t('mobile.purchases.tokens')})
            </Text>
          )}
        </View>
      </View>

      {item.items.length > 0 && (
        <View
          style={{
            marginTop: spacing.sm,
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
            gap: 2,
          }}
        >
          {item.items.map((line, i) => (
            <View key={`${item.id}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[typography.bodySmall, { color: colors.text.secondary, flex: 1 }]} numberOfLines={1}>
                {line.quantity} × {line.name}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
                ${(line.quantity * line.unit_price).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!!item.receipt_no && (
        <Text style={[typography.caption, { color: colors.text.tertiary, marginTop: spacing.xs }]}>
          {t('mobile.purchases.receipt')}: {item.receipt_no}
        </Text>
      )}
    </Card>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={purchases}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        contentContainerStyle={
          purchases.length === 0 ? { flex: 1 } : { padding: spacing.md, paddingBottom: spacing.xxl }
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, paddingHorizontal: spacing.lg }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: borderRadius.full,
                backgroundColor: colors.surfaceSecondary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
            >
              <Ionicons name="receipt-outline" size={30} color={colors.text.tertiary} />
            </View>
            <Text style={[typography.headingSmall, { color: colors.text.primary, marginBottom: spacing.xs }]}>
              {t('mobile.purchases.emptyTitle')}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, textAlign: 'center' }]}>
              {t('mobile.purchases.emptyMessage')}
            </Text>
          </View>
        }
      />
    </View>
  );
}
