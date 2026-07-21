import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRewardBalance } from '@/hooks/useRewards';
import {
  useGenerateRedemptionQR,
  useOutletSearch,
  RedemptionQR,
  OutletOption,
  extractApiError,
} from '@/hooks/useRedemption';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';

// Mirrors the backend default in backend/src/routes/redemption.ts (TOKEN_VALUE env, default 0.05);
// the POST /redemption/qr response does not include the token value, so keep this in sync if it changes.
const TOKEN_VALUE = 0.05; // 1 token = $0.05

export default function RedeemScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: balance } = useRewardBalance();
  const generateQR = useGenerateRedemptionQR();

  const [tokensInput, setTokensInput] = useState('');
  const [activeQR, setActiveQR] = useState<RedemptionQR | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  // Which branch the customer is standing in + their bill (both optional —
  // the merchant confirms the amount at the till).
  const [outletQuery, setOutletQuery] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState<OutletOption | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const { data: outletResults = [] } = useOutletSearch(outletQuery);

  const maxTokens = Math.floor((balance?.balance ?? 0) / TOKEN_VALUE);

  const parsedTokens = parseInt(tokensInput, 10);
  const isValidTokens =
    tokensInput !== '' &&
    !Number.isNaN(parsedTokens) &&
    parsedTokens >= 1 &&
    parsedTokens <= maxTokens;

  const secondsLeft = useMemo(() => {
    if (!activeQR) return 0;
    return Math.max(
      0,
      Math.ceil((new Date(activeQR.expires_at).getTime() - now) / 1000)
    );
  }, [activeQR, now]);

  const isExpired = activeQR !== null && secondsLeft <= 0;

  // Live countdown ticker
  useEffect(() => {
    if (!activeQR) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeQR]);

  const handleGenerate = async () => {
    if (!isValidTokens) return;
    setError(null);
    try {
      const parsedAmount = parseFloat(amountInput);
      const result = await generateQR.mutateAsync({
        tokens: parsedTokens,
        ...(selectedOutlet ? { outlet_id: selectedOutlet.id } : {}),
        ...(!Number.isNaN(parsedAmount) && parsedAmount > 0
          ? { purchase_amount: parsedAmount }
          : {}),
      });
      setActiveQR(result);
      setNow(Date.now());
    } catch (err) {
      setError(
        extractApiError(err, t('mobile.redeem.generateError'))
      );
    }
  };

  const handleReset = () => {
    setActiveQR(null);
    setError(null);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Balance Card */}
      <Card style={{ marginBottom: spacing.lg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.xs,
          }}
        >
          <Ionicons name="wallet-outline" size={20} color={colors.primary} />
          <Text
            style={[typography.bodyMedium, { color: colors.text.secondary }]}
          >
            {t('mobile.redeem.availableBalance')}
          </Text>
        </View>
        <Text
          style={[
            typography.displaySmall,
            { color: colors.text.primary },
          ]}
        >
          ${(balance?.balance ?? 0).toFixed(2)}
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { color: colors.text.tertiary, marginTop: spacing.xs },
          ]}
        >
          {t('mobile.redeem.maxTokens', { count: maxTokens })}
        </Text>
      </Card>

      {!activeQR || isExpired ? (
        <>
          {isExpired && (
            <Card
              style={{
                marginBottom: spacing.lg,
                backgroundColor: colors.warning + '10',
                borderWidth: 1,
                borderColor: colors.warning + '30',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.warning}
                />
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: colors.warningDark, flex: 1 },
                  ]}
                >
                  {t('mobile.redeem.expiredMessage')}
                </Text>
              </View>
            </Card>
          )}

          {/* Which branch are you in? */}
          <Text
            style={[
              typography.labelMedium,
              { color: colors.text.primary, marginBottom: spacing.xs },
            ]}
          >
            {t('mobile.redeem.selectOutlet')}
          </Text>
          {selectedOutlet ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: colors.primary + '10',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <Ionicons name="storefront-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={[typography.bodyMedium, { color: colors.text.primary, fontFamily: fontFamily.semibold }]}
                >
                  {selectedOutlet.name}
                </Text>
                <Text numberOfLines={1} style={[typography.caption, { color: colors.text.secondary }]}>
                  {selectedOutlet.business}
                  {selectedOutlet.city ? ` · ${selectedOutlet.city}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedOutlet(null)}>
                <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginBottom: spacing.md }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceSecondary,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                }}
              >
                <Ionicons name="search" size={18} color={colors.text.secondary} style={{ marginRight: spacing.sm }} />
                <TextInput
                  value={outletQuery}
                  onChangeText={setOutletQuery}
                  placeholder={t('mobile.redeem.searchOutlet')}
                  placeholderTextColor={colors.text.tertiary}
                  style={[
                    typography.bodyMedium,
                    { flex: 1, color: colors.text.primary, paddingVertical: spacing.md },
                  ]}
                />
              </View>
              {outletResults.slice(0, 5).map((o) => (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => setSelectedOutlet(o)}
                  style={{
                    paddingVertical: spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                  }}
                >
                  <Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.text.primary }]}>
                    {o.name}
                  </Text>
                  <Text numberOfLines={1} style={[typography.caption, { color: colors.text.secondary }]}>
                    {o.business}
                    {o.city ? ` · ${o.city}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Optional bill amount — the merchant confirms it at the till */}
          <Text
            style={[
              typography.labelMedium,
              { color: colors.text.primary, marginBottom: spacing.xs },
            ]}
          >
            {t('mobile.redeem.purchaseAmountOptional')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <Text style={[typography.bodyMedium, { color: colors.text.secondary, marginRight: spacing.xs }]}>$</Text>
            <TextInput
              value={amountInput}
              onChangeText={(text) => setAmountInput(text.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
              style={[
                typography.bodyMedium,
                { flex: 1, color: colors.text.primary, paddingVertical: spacing.md },
              ]}
            />
          </View>

          {/* Token Input */}
          <Text
            style={[
              typography.labelMedium,
              { color: colors.text.primary, marginBottom: spacing.xs },
            ]}
          >
            {t('mobile.redeem.tokensToRedeem')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1.5,
              borderColor: error ? colors.danger : colors.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              marginBottom: spacing.xs,
            }}
          >
            <Ionicons
              name="ticket-outline"
              size={20}
              color={colors.text.secondary}
              style={{ marginRight: spacing.sm }}
            />
            <TextInput
              value={tokensInput}
              onChangeText={(text) => {
                setTokensInput(text.replace(/[^0-9]/g, ''));
                setError(null);
              }}
              placeholder={t('mobile.redeem.placeholder', { max: maxTokens })}
              placeholderTextColor={colors.text.tertiary}
              keyboardType="number-pad"
              editable={maxTokens > 0}
              style={[
                typography.bodyMedium,
                {
                  flex: 1,
                  color: colors.text.primary,
                  paddingVertical: spacing.md,
                },
              ]}
            />
            {isValidTokens && (
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.accent, fontFamily: fontFamily.semibold },
                ]}
              >
                = ${(parsedTokens * TOKEN_VALUE).toFixed(2)}
              </Text>
            )}
          </View>

          {tokensInput !== '' && !isValidTokens && (
            <Text
              style={[
                typography.bodySmall,
                { color: colors.danger, marginBottom: spacing.sm },
              ]}
            >
              {maxTokens < 1
                ? t('mobile.redeem.balanceTooLow')
                : t('mobile.redeem.enterWholeNumber', { max: maxTokens })}
            </Text>
          )}

          {error && (
            <Text
              style={[
                typography.bodySmall,
                { color: colors.danger, marginBottom: spacing.sm },
              ]}
            >
              {error}
            </Text>
          )}

          <Button
            title={t('mobile.redeem.generateQR')}
            onPress={handleGenerate}
            loading={generateQR.isPending}
            disabled={!isValidTokens}
            size="lg"
            icon={
              <Ionicons
                name="qr-code-outline"
                size={20}
                color={colors.text.inverse}
              />
            }
            style={{ marginTop: spacing.md }}
          />
        </>
      ) : (
        <>
          {/* Active QR Code */}
          <Card style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <View
              style={{
                padding: spacing.md,
                backgroundColor: '#FFF',
                borderRadius: borderRadius.lg,
                marginBottom: spacing.md,
              }}
            >
              <QRCode
                value={JSON.stringify({
                  qr: activeQR.qr,
                  signature: activeQR.signature,
                })}
                size={220}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                marginBottom: spacing.sm,
              }}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={secondsLeft <= 30 ? colors.danger : colors.primary}
              />
              <Text
                style={[
                  typography.headingMedium,
                  {
                    color:
                      secondsLeft <= 30 ? colors.danger : colors.text.primary,
                  },
                ]}
              >
                {formatCountdown(secondsLeft)}
              </Text>
            </View>

            <Text
              style={[
                typography.bodyMedium,
                {
                  color: colors.text.primary,
                  fontFamily: fontFamily.semibold,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              {t('mobile.redeem.tokensValue', { count: parsedTokens, amount: (parsedTokens * TOKEN_VALUE).toFixed(2) })}
            </Text>
            <Text
              style={[
                typography.bodySmall,
                { color: colors.text.secondary, textAlign: 'center' },
              ]}
            >
              {t('mobile.redeem.showToMerchant')}
            </Text>
          </Card>

          <Button
            title={t('mobile.common.cancel')}
            onPress={handleReset}
            variant="outline"
            style={{ marginTop: spacing.xs }}
          />
        </>
      )}
    </ScrollView>
  );
}
