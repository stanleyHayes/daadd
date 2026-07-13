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

export default function EditProfileScreen() {
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
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update your profile');
      return;
    }

    try {
      await updateProfile.mutateAsync({ name: name.trim() });
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully');
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Failed to update password';
      Alert.alert('Error', message);
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
            Edit Profile
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
              Full Name
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
                placeholder="Enter your full name"
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
              Email Address
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
                placeholder="No email on file"
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
              Email cannot be changed
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
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
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
              Cancel
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
            Change Password
          </Text>

          {(
            [
              {
                label: 'Current Password',
                value: currentPassword,
                onChangeText: setCurrentPassword,
                placeholder: 'Enter current password',
              },
              {
                label: 'New Password',
                value: newPassword,
                onChangeText: setNewPassword,
                placeholder: 'Enter new password',
              },
              {
                label: 'Confirm New Password',
                value: confirmPassword,
                onChangeText: setConfirmPassword,
                placeholder: 'Re-enter new password',
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
              {changePassword.isPending ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
