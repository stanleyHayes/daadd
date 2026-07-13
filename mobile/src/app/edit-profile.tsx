import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { useUpdateProfile, useChangePassword } from '@/hooks/useAuth';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [name, setName] = useState(user?.name || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('mobile.common.error'), t('mobile.editProfile.errors.nameEmpty'));
      return;
    }
    if (!user) {
      Alert.alert(t('mobile.common.error'), t('mobile.editProfile.errors.notLoggedIn'));
      return;
    }

    try {
      await updateProfile.mutateAsync({ name: name.trim() });
      Alert.alert(t('mobile.common.success'), t('mobile.editProfile.errors.profileUpdated'));
      router.back();
    } catch {
      Alert.alert(t('mobile.common.error'), t('mobile.editProfile.errors.updateFailed'));
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert(t('mobile.common.error'), t('mobile.editProfile.errors.fillPasswordFields'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('mobile.common.error'), t('mobile.editProfile.errors.passwordMin6'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('mobile.common.error'), t('mobile.editProfile.errors.passwordsMismatch'));
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('mobile.common.success'), t('mobile.editProfile.errors.passwordUpdated'));
    } catch (error: any) {
      const message =
        error?.response?.data?.message || t('mobile.editProfile.errors.passwordFailed');
      Alert.alert(t('mobile.common.error'), message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text
            style={[
              typography.headingMedium,
              { color: colors.text.primary, marginLeft: spacing.md, flex: 1 },
            ]}
          >
            {t('mobile.editProfile.title')}
          </Text>
        </View>

        {/* Form */}
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          {/* Name Field */}
          <View>
            <Text
              style={[
                typography.labelMedium,
                { color: colors.text.primary, marginBottom: spacing.xs },
              ]}
            >
              {t('mobile.auth.fullName')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
              }}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.text.secondary}
                style={{ marginRight: spacing.sm }}
              />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('mobile.auth.fullNamePlaceholder')}
                placeholderTextColor={colors.text.secondary}
                style={[
                  typography.bodyMedium,
                  {
                    flex: 1,
                    color: colors.text.primary,
                    paddingVertical: spacing.md,
                  },
                ]}
              />
            </View>
          </View>

          {/* Email Field (read-only) */}
          <View>
            <Text
              style={[
                typography.labelMedium,
                { color: colors.text.primary, marginBottom: spacing.xs },
              ]}
            >
              {t('mobile.editProfile.emailAddress')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                opacity: 0.7,
              }}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.text.secondary}
                style={{ marginRight: spacing.sm }}
              />
              <TextInput
                value={user?.email || ''}
                placeholder={t('mobile.editProfile.noEmailOnFile')}
                placeholderTextColor={colors.text.secondary}
                editable={false}
                style={[
                  typography.bodyMedium,
                  {
                    flex: 1,
                    color: colors.text.secondary,
                    paddingVertical: spacing.md,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                typography.bodySmall,
                { color: colors.text.secondary, marginTop: spacing.xs },
              ]}
            >
              {t('mobile.editProfile.emailCannotChange')}
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateProfile.isPending}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              alignItems: 'center',
              marginTop: spacing.lg,
              opacity: updateProfile.isPending ? 0.6 : 1,
            }}
          >
            <Text
              style={[
                typography.labelMedium,
                { color: '#fff' },
              ]}
            >
              {updateProfile.isPending ? t('mobile.editProfile.saving') : t('mobile.editProfile.saveChanges')}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={updateProfile.isPending}
            style={{
              backgroundColor: colors.surfaceSecondary,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={[
                typography.labelMedium,
                { color: colors.text.primary },
              ]}
            >
              {t('mobile.common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Change Password */}
        <View
          style={{
            padding: spacing.lg,
            gap: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text
            style={[
              typography.headingSmall,
              { color: colors.text.primary },
            ]}
          >
            {t('mobile.editProfile.changePassword')}
          </Text>

          {(
            [
              {
                label: t('mobile.editProfile.currentPassword'),
                value: currentPassword,
                onChangeText: setCurrentPassword,
                placeholder: t('mobile.editProfile.currentPasswordPlaceholder'),
              },
              {
                label: t('mobile.editProfile.newPassword'),
                value: newPassword,
                onChangeText: setNewPassword,
                placeholder: t('mobile.editProfile.newPasswordPlaceholder'),
              },
              {
                label: t('mobile.editProfile.confirmNewPassword'),
                value: confirmPassword,
                onChangeText: setConfirmPassword,
                placeholder: t('mobile.editProfile.confirmNewPasswordPlaceholder'),
              },
            ] as const
          ).map((field) => (
            <View key={field.label}>
              <Text
                style={[
                  typography.labelMedium,
                  { color: colors.text.primary, marginBottom: spacing.xs },
                ]}
              >
                {field.label}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text.secondary}
                  style={{ marginRight: spacing.sm }}
                />
                <TextInput
                  value={field.value}
                  onChangeText={field.onChangeText}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.text.secondary}
                  secureTextEntry
                  autoCapitalize="none"
                  style={[
                    typography.bodyMedium,
                    {
                      flex: 1,
                      color: colors.text.primary,
                      paddingVertical: spacing.md,
                    },
                  ]}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={changePassword.isPending}
            style={{
              backgroundColor: colors.secondary,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              alignItems: 'center',
              opacity: changePassword.isPending ? 0.6 : 1,
            }}
          >
            <Text
              style={[
                typography.labelMedium,
                { color: colors.text.inverse, fontFamily: fontFamily.semibold },
              ]}
            >
              {changePassword.isPending ? t('mobile.editProfile.updating') : t('mobile.editProfile.updatePassword')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
