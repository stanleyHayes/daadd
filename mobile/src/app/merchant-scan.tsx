import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import {
  useScanRedemption,
  useValidateRedemption,
  useConfirmRedemption,
  ScanResult,
  ValidateResult,
  ConfirmResult,
  extractApiError,
} from '@/hooks/useRedemption';
import { useCampaigns } from '@/hooks/useDashboard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';

type Step = 'scan' | 'amount' | 'summary' | 'success' | 'error';

export default function MerchantScanScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const processingRef = useRef(false);

  const scanRedemption = useScanRedemption();
  const validateRedemption = useValidateRedemption();
  const confirmRedemption = useConfirmRedemption();

  // The merchant's active campaigns — lets them choose which one a sale counts
  // toward when they run more than one at once (the server defaults to the
  // most recent otherwise).
  const activeCampaignsQuery = useCampaigns({ status: 'active' });
  const activeCampaigns = activeCampaignsQuery.data?.data ?? [];
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>();

  useEffect(() => {
    const list = activeCampaignsQuery.data?.data ?? [];
    if (list.length && !list.some((c) => c.id === selectedCampaignId)) {
      setSelectedCampaignId(list[0].id);
    }
  }, [activeCampaignsQuery.data, selectedCampaignId]);

  const [step, setStep] = useState<Step>('scan');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Itemised basket (optional). When the cashier itemises, the bill is derived
  // from the lines unless they typed an explicit total.
  const [items, setItems] = useState<{ name: string; quantity: number; unit_price: number }[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  const itemsTotal = items.reduce((n, it) => n + it.quantity * it.unit_price, 0);

  const addItem = () => {
    const price = parseFloat(itemPrice);
    const qty = parseInt(itemQty, 10);
    if (!itemName.trim() || Number.isNaN(price) || price < 0) return;
    setItems((prev) => [
      ...prev,
      { name: itemName.trim(), quantity: Number.isNaN(qty) || qty < 1 ? 1 : qty, unit_price: price },
    ]);
    setItemName('');
    setItemQty('1');
    setItemPrice('');
  };

  const reset = () => {
    processingRef.current = false;
    setStep('scan');
    setScanResult(null);
    setValidateResult(null);
    setConfirmResult(null);
    setAmountInput('');
    setItems([]);
    setItemName('');
    setItemQty('1');
    setItemPrice('');
    setError(null);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (processingRef.current || step !== 'scan') return;
    processingRef.current = true;

    let payload: { qr: string; signature: string };
    try {
      payload = JSON.parse(data);
      if (!payload.qr || !payload.signature) {
        throw new Error('Missing fields');
      }
    } catch {
      setError(t('mobile.merchantScan.invalidQR'));
      setStep('error');
      return;
    }

    try {
      const result = await scanRedemption.mutateAsync(payload);
      setScanResult(result);
      setStep('amount');
    } catch (err) {
      setError(
        extractApiError(
          err,
          t('mobile.merchantScan.qrExpired')
        )
      );
      setStep('error');
    }
  };

  const parsedAmount = parseFloat(amountInput);
  const hasTypedAmount = amountInput !== '' && !Number.isNaN(parsedAmount) && parsedAmount > 0;
  // A typed total wins; otherwise the itemised lines make up the bill.
  const effectiveAmount = hasTypedAmount ? parsedAmount : itemsTotal;
  const isValidAmount = effectiveAmount > 0;

  const handleValidate = async () => {
    if (!scanResult || !isValidAmount) return;
    setError(null);
    try {
      const result = await validateRedemption.mutateAsync({
        redemption_id: scanResult.redemption_id,
        purchase_amount: effectiveAmount,
        campaign_id: selectedCampaignId,
        ...(items.length ? { items } : {}),
      });
      setValidateResult(result);
      setStep('summary');
    } catch (err) {
      setError(
        extractApiError(err, t('mobile.merchantScan.validateError'))
      );
    }
  };

  const handleConfirm = async () => {
    if (!scanResult) return;
    setError(null);
    try {
      const result = await confirmRedemption.mutateAsync(
        scanResult.redemption_id
      );
      setConfirmResult(result);
      setStep('success');
    } catch (err) {
      setError(
        extractApiError(err, t('mobile.merchantScan.confirmError'))
      );
    }
  };

  // Permission states
  if (!permission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }}
      >
        <Ionicons
          name="camera-outline"
          size={64}
          color={colors.text.secondary}
          style={{ marginBottom: spacing.md }}
        />
        <Text
          style={[
            typography.headingMedium,
            {
              color: colors.text.primary,
              textAlign: 'center',
              marginBottom: spacing.sm,
            },
          ]}
        >
          {t('mobile.merchantScan.cameraAccessNeeded')}
        </Text>
        <Text
          style={[
            typography.bodyMedium,
            {
              color: colors.text.secondary,
              textAlign: 'center',
              marginBottom: spacing.lg,
            },
          ]}
        >
          {t('mobile.merchantScan.cameraAccessMessage')}
        </Text>
        <Button title={t('mobile.merchantScan.grantPermission')} onPress={requestPermission} />
      </View>
    );
  }

  if (step === 'scan') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: spacing.lg,
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        >
          <Text
            style={[
              typography.bodyMedium,
              { color: '#FFF', textAlign: 'center' },
            ]}
          >
            {t('mobile.merchantScan.pointCamera')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      {step === 'error' && (
        <Card style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.danger + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Ionicons name="close-circle" size={36} color={colors.danger} />
          </View>
          <Text
            style={[
              typography.headingMedium,
              {
                color: colors.text.primary,
                textAlign: 'center',
                marginBottom: spacing.sm,
              },
            ]}
          >
            {t('mobile.merchantScan.scanFailed')}
          </Text>
          <Text
            style={[
              typography.bodyMedium,
              {
                color: colors.text.secondary,
                textAlign: 'center',
                marginBottom: spacing.lg,
              },
            ]}
          >
            {error}
          </Text>
          <Button title={t('mobile.merchantScan.scanAgain')} onPress={reset} style={{ width: '100%' }} />
        </Card>
      )}

      {step === 'amount' && scanResult && (
        <>
          <Card style={{ marginBottom: spacing.lg }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}
            >
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={colors.primary}
              />
              <Text
                style={[typography.headingSmall, { color: colors.text.primary }]}
              >
                {scanResult.customer_name}
              </Text>
            </View>
            <Text
              style={[typography.bodyMedium, { color: colors.text.secondary }]}
            >
              {t('mobile.merchantScan.redeeming')}{' '}
              <Text style={{ fontFamily: fontFamily.bold, color: colors.accent }}>
                {t('mobile.merchantScan.tokens', { count: scanResult.tokens })}
              </Text>
            </Text>
          </Card>

          {activeCampaigns.length >= 2 && (
            <>
              <Text
                style={[
                  typography.labelMedium,
                  { color: colors.text.primary, marginBottom: spacing.xs },
                ]}
              >
                {t('mobile.merchantScan.countTowardCampaign')}
              </Text>
              <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
                {activeCampaigns.map((campaign) => {
                  const selected = campaign.id === selectedCampaignId;
                  return (
                    <TouchableOpacity
                      key={campaign.id}
                      onPress={() => setSelectedCampaignId(campaign.id)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        borderRadius: borderRadius.md,
                        borderWidth: 1.5,
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected
                          ? colors.primary + '10'
                          : colors.surfaceSecondary,
                      }}
                    >
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={selected ? colors.primary : colors.text.tertiary}
                      />
                      <Text
                        style={[
                          typography.bodyMedium,
                          { color: colors.text.primary, flex: 1 },
                        ]}
                        numberOfLines={1}
                      >
                        {campaign.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text
            style={[
              typography.labelMedium,
              { color: colors.text.primary, marginBottom: spacing.xs },
            ]}
          >
            {t('mobile.merchantScan.purchaseAmount')}
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
            <Text
              style={[
                typography.headingMedium,
                { color: colors.text.secondary, marginRight: spacing.xs },
              ]}
            >
              $
            </Text>
            <TextInput
              value={amountInput}
              onChangeText={(text) =>
                setAmountInput(text.replace(/[^0-9.]/g, ''))
              }
              placeholder="0.00"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
              autoFocus
              style={[
                typography.headingMedium,
                {
                  flex: 1,
                  color: colors.text.primary,
                  paddingVertical: spacing.md,
                },
              ]}
            />
          </View>

          {/* Itemised basket (optional) */}
          <Text
            style={[
              typography.labelMedium,
              { color: colors.text.primary, marginBottom: spacing.xs },
            ]}
          >
            {t('mobile.merchantScan.itemsTitle')}
          </Text>
          {items.map((line, i) => (
            <View
              key={`${line.name}-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.xs,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
              }}
            >
              <Text style={[typography.bodyMedium, { color: colors.text.primary, flex: 1 }]} numberOfLines={1}>
                {line.quantity} × {line.name}
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.text.secondary, marginRight: spacing.sm }]}>
                ${(line.quantity * line.unit_price).toFixed(2)}
              </Text>
              <TouchableOpacity onPress={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                <Ionicons name="close-circle-outline" size={18} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, marginBottom: spacing.xs }}>
            <TextInput
              value={itemName}
              onChangeText={setItemName}
              placeholder={t('mobile.merchantScan.itemName')}
              placeholderTextColor={colors.text.tertiary}
              style={[
                typography.bodyMedium,
                {
                  flex: 2,
                  color: colors.text.primary,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.sm,
                },
              ]}
            />
            <TextInput
              value={itemQty}
              onChangeText={(x) => setItemQty(x.replace(/[^0-9]/g, ''))}
              placeholder={t('mobile.merchantScan.itemQty')}
              placeholderTextColor={colors.text.tertiary}
              keyboardType="number-pad"
              style={[
                typography.bodyMedium,
                {
                  width: 56,
                  textAlign: 'center',
                  color: colors.text.primary,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            />
            <TextInput
              value={itemPrice}
              onChangeText={(x) => setItemPrice(x.replace(/[^0-9.]/g, ''))}
              placeholder={t('mobile.merchantScan.itemPrice')}
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
              style={[
                typography.bodyMedium,
                {
                  flex: 1,
                  color: colors.text.primary,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.sm,
                },
              ]}
            />
            <TouchableOpacity
              onPress={addItem}
              style={{
                width: 44,
                borderRadius: borderRadius.md,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {items.length > 0 && (
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.md }]}>
              {t('mobile.merchantScan.itemsTotal')}: ${itemsTotal.toFixed(2)}
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
            title={t('mobile.merchantScan.continue')}
            onPress={handleValidate}
            loading={validateRedemption.isPending}
            disabled={!isValidAmount}
            size="lg"
          />
          <Button
            title={t('mobile.common.cancel')}
            onPress={reset}
            variant="outline"
            style={{ marginTop: spacing.sm }}
          />
        </>
      )}

      {step === 'summary' && validateResult && (
        <>
          <Card style={{ marginBottom: spacing.lg, gap: spacing.sm }}>
            <Text
              style={[
                typography.headingSmall,
                { color: colors.text.primary, marginBottom: spacing.xs },
              ]}
            >
              {t('mobile.merchantScan.summary.title')}
            </Text>
            <SummaryRow
              label={t('mobile.merchantScan.summary.customer')}
              value={validateResult.customer_name}
              colors={colors}
            />
            <SummaryRow
              label={t('mobile.merchantScan.summary.purchase')}
              value={`$${validateResult.purchase_amount.toFixed(2)}`}
              colors={colors}
            />
            <SummaryRow
              label={t('mobile.merchantScan.summary.tokensUsed')}
              value={`${validateResult.tokens_used}`}
              colors={colors}
            />
            <SummaryRow
              label={t('mobile.merchantScan.summary.discount')}
              value={`-$${validateResult.discount.toFixed(2)}`}
              colors={colors}
              valueColor={colors.accent}
            />
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: spacing.xs,
              }}
            />
            <SummaryRow
              label={t('mobile.merchantScan.summary.customerPays')}
              value={`$${validateResult.final_amount.toFixed(2)}`}
              colors={colors}
              bold
            />
            {!!validateResult.receipt_no && (
              <SummaryRow
                label={t('mobile.merchantScan.receipt')}
                value={validateResult.receipt_no}
                colors={colors}
              />
            )}
          </Card>

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
            title={t('mobile.merchantScan.approveRedemption')}
            onPress={handleConfirm}
            loading={confirmRedemption.isPending}
            size="lg"
            icon={
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.text.inverse}
              />
            }
          />
          <Button
            title={t('mobile.common.cancel')}
            onPress={reset}
            variant="outline"
            style={{ marginTop: spacing.sm }}
          />
        </>
      )}

      {step === 'success' && confirmResult && (
        <Card style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.accent + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Ionicons name="checkmark-circle" size={44} color={colors.accent} />
          </View>
          <Text
            style={[
              typography.headingMedium,
              {
                color: colors.text.primary,
                textAlign: 'center',
                marginBottom: spacing.sm,
              },
            ]}
          >
            {t('mobile.merchantScan.approvedTitle')}
          </Text>
          <Text
            style={[
              typography.bodyMedium,
              {
                color: colors.text.secondary,
                textAlign: 'center',
                marginBottom: spacing.lg,
              },
            ]}
          >
            {t('mobile.merchantScan.approvedMessage', {
              tokens: confirmResult.tokens_used,
              discount: confirmResult.discount.toFixed(2),
              balance: confirmResult.new_balance.toFixed(2),
            })}
          </Text>
          <Button
            title={t('mobile.merchantScan.scanAnother')}
            onPress={reset}
            style={{ width: '100%' }}
          />
        </Card>
      )}
    </ScrollView>
  );
}

function SummaryRow({
  label,
  value,
  colors,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text style={[typography.bodyMedium, { color: colors.text.secondary }]}>
        {label}
      </Text>
      <Text
        style={[
          bold ? typography.headingSmall : typography.bodyMedium,
          {
            color: valueColor ?? colors.text.primary,
            fontFamily: bold ? fontFamily.bold : fontFamily.semibold,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
