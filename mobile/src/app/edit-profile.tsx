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
import { useColors } from '@/hooks/useColors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';

export default function EditProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update your profile');
      return;
    }

    setIsSaving(true);
    try {
      // In a real app, this would call the backend
      // For now, we'll just update the local store
      updateUser({ name, email });
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
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

          {/* Email Field */}
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
              }}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.text.secondary}
                style={{ marginRight: spacing.sm }}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
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
            disabled={isSaving}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              alignItems: 'center',
              marginTop: spacing.lg,
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            <Text
              style={[
                typography.labelMedium,
                { color: '#fff' },
              ]}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isSaving}
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
      </ScrollView>
    </SafeAreaView>
  );
}
