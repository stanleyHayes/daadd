import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useProduct, useCreateOrder, usePayOrder, formatMinor, commerceError } from '@/hooks/useCommerce';

export default function ProductScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const createOrder = useCreateOrder();
  const payOrder = usePayOrder();

  const [qty, setQty] = useState(1);
  const [contact, setContact] = useState({ name: '', phone: '', address: '', city: '' });
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const buy = async () => {
    setError(null);
    if (!contact.name.trim() || !contact.phone.trim() || !contact.address.trim()) {
      setError(t('mobile.checkout.contactRequired'));
      return;
    }
    try {
      const order = await createOrder.mutateAsync({ items: [{ product_id: product.id, quantity: qty }], contact });
      const pay = await payOrder.mutateAsync(order.id);
      if (pay.requires_payment && pay.authorization_url) {
        await Linking.openURL(pay.authorization_url); // Paystack checkout in the browser
      }
      // The webhook reconciles server-side; the order screen re-fetches on focus.
      router.replace(`/order/${order.id}` as Href);
    } catch (e) {
      setError(commerceError(e));
    }
  };

  const total = product.price_minor * qty;
  const field = (key: keyof typeof contact, label: string, extra: object = {}) => (
    <TextInput
      value={contact[key]}
      onChangeText={(v) => setContact({ ...contact, [key]: v })}
      placeholder={label}
      placeholderTextColor={colors.text.tertiary}
      style={{ borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.xs, color: colors.text.primary }}
      {...extra}
    />
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
      <View style={{ height: 220, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Ionicons name="cube-outline" size={48} color={colors.text.tertiary} />
        )}
      </View>

      <Text style={[typography.headingMedium, { color: colors.text.primary }]}>{product.name}</Text>
      <Text style={[typography.headingSmall, { color: colors.primary, marginTop: 2 }]}>{formatMinor(product.price_minor, product.currency)}</Text>
      {!!product.description && <Text style={[typography.bodyMedium, { color: colors.text.secondary, marginTop: spacing.sm }]}>{product.description}</Text>}

      {/* Quantity */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
        <Text style={[typography.bodyMedium, { color: colors.text.secondary, marginRight: spacing.md }]}>{t('mobile.checkout.quantity')}</Text>
        <TouchableOpacity onPress={() => setQty((q) => Math.max(1, q - 1))} style={{ padding: spacing.xs }}>
          <Ionicons name="remove-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[typography.bodyLarge, { color: colors.text.primary, marginHorizontal: spacing.sm }]}>{qty}</Text>
        <TouchableOpacity onPress={() => setQty((q) => q + 1)} style={{ padding: spacing.xs }}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Contact / delivery */}
      <Card style={{ marginTop: spacing.md }}>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>{t('mobile.checkout.delivery')}</Text>
        {field('name', t('mobile.checkout.name'))}
        {field('phone', t('mobile.checkout.phone'), { keyboardType: 'phone-pad' })}
        {field('address', t('mobile.checkout.address'))}
        {field('city', t('mobile.checkout.city'))}
      </Card>

      {!!error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

      <Button
        title={t('mobile.checkout.buy', { total: formatMinor(total, product.currency) })}
        onPress={buy}
        loading={createOrder.isPending || payOrder.isPending}
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}
