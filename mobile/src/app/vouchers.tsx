import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Share,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAuthStore } from '@/stores/auth.store';
import {
  useMyVouchers,
  useIssueVoucher,
  useClaimVoucher,
  useRedeemVoucher,
  voucherError,
  type Voucher,
  type VoucherStatus,
} from '@/hooks/useVouchers';

const STATUS_TONE: Record<VoucherStatus, string> = {
  issued: '#2563EB',
  claimed: '#F59E0B',
  redeemed: '#10B981',
  expired: '#94A3B8',
  revoked: '#EF4444',
};

export default function VouchersScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading, refetch } = useMyVouchers();

  const [modal, setModal] = useState<null | 'send' | 'claim' | 'redeem'>(null);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
    >
      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <ActionButton icon="gift-outline" label={t('mobile.vouchers.send')} onPress={() => setModal('send')} color={colors.primary} />
        <ActionButton icon="pricetag-outline" label={t('mobile.vouchers.haveCode')} onPress={() => setModal('claim')} color={colors.secondary} />
      </View>
      {role === 'merchant' && (
        <Button variant="outline" title={t('mobile.vouchers.redeemCustomer')} onPress={() => setModal('redeem')} style={{ marginBottom: spacing.md }} />
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <VoucherList title={t('mobile.vouchers.received')} items={data?.received || []} colors={colors} t={t} />
          <VoucherList title={t('mobile.vouchers.sent')} items={data?.sent || []} colors={colors} t={t} />
        </>
      )}

      {modal === 'send' && <SendModal onClose={() => { setModal(null); refetch(); }} />}
      {modal === 'claim' && <ClaimModal onClose={() => { setModal(null); refetch(); }} />}
      {modal === 'redeem' && <RedeemModal onClose={() => { setModal(null); refetch(); }} />}
    </ScrollView>
  );
}

function ActionButton({ icon, label, onPress, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: color + '18',
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
      }}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[typography.buttonSmall, { color, marginTop: 4 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function VoucherList({ title, items, colors, t }: { title: string; items: Voucher[]; colors: any; t: (k: string, o?: any) => string }) {
  if (items.length === 0) return null;
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={[typography.headingSmall, { color: colors.text.primary, marginBottom: spacing.sm }]}>{title}</Text>
      {items.map((v) => (
        <Card key={v.id} style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyLarge, { color: colors.text.primary }]}>
                {t('mobile.vouchers.tokensAmount', { tokens: v.amount_tokens })}
              </Text>
              {!!v.message && (
                <Text style={[typography.bodySmall, { color: colors.text.secondary }]} numberOfLines={1}>
                  “{v.message}”
                </Text>
              )}
              <Text style={[typography.caption, { color: colors.text.tertiary, marginTop: 2 }]}>{v.code}</Text>
            </View>
            <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999, backgroundColor: STATUS_TONE[v.status] + '22' }}>
              <Text style={[typography.caption, { color: STATUS_TONE[v.status] }]}>{t(`mobile.vouchers.status.${v.status}`)}</Text>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={[typography.headingMedium, { color: colors.text.primary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function SendModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const issue = useIssueVoucher();
  const [tokens, setTokens] = useState('100');
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState<Voucher | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const n = parseInt(tokens, 10);
    if (!n || n < 1) return setError(t('mobile.vouchers.invalidAmount'));
    try {
      const v = await issue.mutateAsync({ amount_tokens: n, message: message.trim() || undefined });
      setCreated(v);
    } catch (e) {
      setError(voucherError(e));
    }
  };

  const shareCode = () => {
    if (!created) return;
    Share.share({ message: t('mobile.vouchers.shareMessage', { code: created.code }) }).catch(() => {});
  };

  return (
    <ModalShell title={t('mobile.vouchers.send')} onClose={onClose}>
      {created ? (
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={44} color={colors.accent} />
          <Text style={[typography.bodyMedium, { color: colors.text.secondary, textAlign: 'center', marginVertical: spacing.sm }]}>
            {t('mobile.vouchers.createdHint')}
          </Text>
          <Text style={[typography.displaySmall, { color: colors.text.primary, letterSpacing: 2 }]}>{created.code}</Text>
          <Button title={t('mobile.vouchers.shareCode')} onPress={shareCode} style={{ marginTop: spacing.md, alignSelf: 'stretch' }} />
          <Button variant="outline" title={t('mobile.common.done')} onPress={onClose} style={{ marginTop: spacing.xs, alignSelf: 'stretch' }} />
        </View>
      ) : (
        <>
          <Text style={[typography.caption, { color: colors.text.secondary }]}>{t('mobile.vouchers.amountLabel')}</Text>
          <TextInput
            value={tokens}
            onChangeText={setTokens}
            keyboardType="number-pad"
            style={inputStyle(colors)}
          />
          <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.sm }]}>{t('mobile.vouchers.messageLabel')}</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={t('mobile.vouchers.messagePlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            maxLength={200}
            style={inputStyle(colors)}
          />
          {!!error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>{error}</Text>}
          <Button title={t('mobile.vouchers.sendGift')} onPress={submit} loading={issue.isPending} style={{ marginTop: spacing.md }} />
        </>
      )}
    </ModalShell>
  );
}

function ClaimModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const claim = useClaimVoucher();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    try {
      await claim.mutateAsync(code.trim().toUpperCase());
      setDone(true);
    } catch (e) {
      setError(voucherError(e));
    }
  };

  return (
    <ModalShell title={t('mobile.vouchers.haveCode')} onClose={onClose}>
      {done ? (
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={44} color={colors.accent} />
          <Text style={[typography.bodyMedium, { color: colors.text.secondary, textAlign: 'center', marginVertical: spacing.sm }]}>
            {t('mobile.vouchers.claimedHint')}
          </Text>
          <Button title={t('mobile.common.done')} onPress={onClose} style={{ alignSelf: 'stretch' }} />
        </View>
      ) : (
        <>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="GV-XXXXXXXXXX"
            placeholderTextColor={colors.text.tertiary}
            style={inputStyle(colors)}
          />
          {!!error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>{error}</Text>}
          <Button title={t('mobile.vouchers.claim')} onPress={submit} loading={claim.isPending} style={{ marginTop: spacing.md }} />
        </>
      )}
    </ModalShell>
  );
}

function RedeemModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const redeem = useRedeemVoucher();
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<{ discount: number; final_amount: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      const r = await redeem.mutateAsync({
        code: code.trim().toUpperCase(),
        purchase_amount: amount ? Number(amount) : undefined,
      });
      setResult({ discount: r.discount, final_amount: r.final_amount });
    } catch (e) {
      setError(voucherError(e));
    }
  };

  return (
    <ModalShell title={t('mobile.vouchers.redeemCustomer')} onClose={onClose}>
      {result ? (
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={44} color={colors.accent} />
          <Text style={[typography.displaySmall, { color: colors.text.primary, marginVertical: spacing.sm }]}>
            −${result.discount.toFixed(2)}
          </Text>
          {result.final_amount != null && (
            <Text style={[typography.bodyMedium, { color: colors.text.secondary }]}>
              {t('mobile.vouchers.finalBill', { amount: result.final_amount.toFixed(2) })}
            </Text>
          )}
          <Button title={t('mobile.common.done')} onPress={onClose} style={{ marginTop: spacing.md, alignSelf: 'stretch' }} />
        </View>
      ) : (
        <>
          <Text style={[typography.caption, { color: colors.text.secondary }]}>{t('mobile.vouchers.codeLabel')}</Text>
          <TextInput value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="GV-XXXXXXXXXX" placeholderTextColor={colors.text.tertiary} style={inputStyle(colors)} />
          <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.sm }]}>{t('mobile.vouchers.billLabel')}</Text>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.text.tertiary} style={inputStyle(colors)} />
          {!!error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>{error}</Text>}
          <Button title={t('mobile.vouchers.applyDiscount')} onPress={submit} loading={redeem.isPending} style={{ marginTop: spacing.md }} />
        </>
      )}
    </ModalShell>
  );
}

function inputStyle(colors: any) {
  return {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: 4,
    color: colors.text.primary,
    fontSize: 16,
  };
}
