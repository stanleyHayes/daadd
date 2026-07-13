import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
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
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';

type Step = 'scan' | 'amount' | 'summary' | 'success' | 'error';

export default function MerchantScanScreen() {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const processingRef = useRef(false);

  const scanRedemption = useScanRedemption();
  const validateRedemption = useValidateRedemption();
  const confirmRedemption = useConfirmRedemption();

  const [step, setStep] = useState<Step>('scan');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    processingRef.current = false;
    setStep('scan');
    setScanResult(null);
    setValidateResult(null);
    setConfirmResult(null);
    setAmountInput('');
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
      setError('Invalid QR code. Please scan a valid customer redemption QR.');
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
          'This QR code is expired, invalid, or already used.'
        )
      );
      setStep('error');
    }
  };

  const parsedAmount = parseFloat(amountInput);
  const isValidAmount =
    amountInput !== '' && !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const handleValidate = async () => {
    if (!scanResult || !isValidAmount) return;
    setError(null);
    try {
      const result = await validateRedemption.mutateAsync({
        redemption_id: scanResult.redemption_id,
        purchase_amount: parsedAmount,
      });
      setValidateResult(result);
      setStep('summary');
    } catch (err) {
      setError(
        extractApiError(err, 'Failed to validate redemption. Please try again.')
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
        extractApiError(err, 'Failed to confirm redemption. Please try again.')
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
          Camera Access Needed
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
          To scan customer QR codes, please allow camera access.
        </Text>
        <Button title="Grant Permission" onPress={requestPermission} />
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
            Point the camera at the customer's redemption QR code
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
            Scan Failed
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
          <Button title="Scan Again" onPress={reset} style={{ width: '100%' }} />
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
              Redeeming{' '}
              <Text style={{ fontFamily: fontFamily.bold, color: colors.accent }}>
                {scanResult.tokens} tokens
              </Text>
            </Text>
          </Card>

          <Text
            style={[
              typography.labelMedium,
              { color: colors.text.primary, marginBottom: spacing.xs },
            ]}
          >
            Purchase amount ($)
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
            title="Continue"
            onPress={handleValidate}
            loading={validateRedemption.isPending}
            disabled={!isValidAmount}
            size="lg"
          />
          <Button
            title="Cancel"
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
              Redemption Summary
            </Text>
            <SummaryRow
              label="Customer"
              value={validateResult.customer_name}
              colors={colors}
            />
            <SummaryRow
              label="Purchase"
              value={`$${validateResult.purchase_amount.toFixed(2)}`}
              colors={colors}
            />
            <SummaryRow
              label="Tokens used"
              value={`${validateResult.tokens_used}`}
              colors={colors}
            />
            <SummaryRow
              label="Discount"
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
              label="Customer pays"
              value={`$${validateResult.final_amount.toFixed(2)}`}
              colors={colors}
              bold
            />
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
            title="Approve Redemption"
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
            title="Cancel"
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
            Redemption Approved
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
            {confirmResult.tokens_used} tokens (${confirmResult.discount.toFixed(2)})
            deducted. Customer's new balance: $
            {confirmResult.new_balance.toFixed(2)}.
          </Text>
          <Button
            title="Scan Another"
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
