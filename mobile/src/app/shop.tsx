import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useProducts, formatMinor } from '@/hooks/useCommerce';

export default function ShopScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { data: products, isLoading } = useProducts();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : !products || products.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: spacing.xxl }}>
          <Ionicons name="storefront-outline" size={44} color={colors.text.tertiary} />
          <Text style={[typography.bodyMedium, { color: colors.text.secondary, marginTop: spacing.sm }]}>{t('mobile.shop.empty')}</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {products.map((p) => (
            <TouchableOpacity key={p.id} style={{ width: '48%', marginBottom: spacing.md }} onPress={() => router.push(`/product/${p.id}` as Href)}>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <View style={{ height: 120, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}>
                  {p.images?.[0] ? (
                    <Image source={{ uri: p.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="cube-outline" size={32} color={colors.text.tertiary} />
                  )}
                </View>
                <View style={{ padding: spacing.sm }}>
                  <Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.text.primary }]}>{p.name}</Text>
                  <Text style={[typography.bodySmall, { color: colors.primary, marginTop: 2 }]}>{formatMinor(p.price_minor, p.currency)}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
