import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useLogout } from '@/hooks/useAuth';
import { useRewards } from '@/hooks/useRewards';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { LinkedDevice } from '@/types';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n, { languages, setLanguage } from '@/i18n';

// Current device only — cross-device listing requires backend support
const CURRENT_DEVICE: LinkedDevice = {
  id: 'current',
  name: '',
  type: 'phone',
  lastActive: new Date().toISOString(),
  isCurrent: true,
};

const deviceIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  phone: 'phone-portrait',
  tablet: 'tablet-portrait',
  tv: 'tv',
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useThemeStore();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const currentLanguageName =
    languages[i18n.resolvedLanguage ?? i18n.language]?.name ?? languages.en.name;

  const deviceName =
    Platform.OS === 'ios'
      ? t('mobile.profile.devices.iphone')
      : Platform.OS === 'android'
        ? t('mobile.profile.devices.android')
        : t('mobile.profile.devices.other');

  const displayUser = user;
  const { data: rewards } = useRewards();

  // Real stats derived from the rewards ledger
  const rewardList = Array.isArray(rewards) ? rewards : [];
  const adsViewed = rewardList.filter((r) => r.amount > 0 && r.status !== 'redeemed').length;
  const totalEarned = rewardList
    .filter((r) => r.amount > 0)
    .reduce((sum, r) => sum + r.amount, 0);
  const joinedDate = (displayUser as any)?.created_at || (displayUser as any)?.createdAt;

  const themeLabels: Record<string, string> = {
    light: t('mobile.profile.theme.light'),
    dark: t('mobile.profile.theme.dark'),
    system: t('mobile.profile.theme.system'),
  };

  const themeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    light: 'sunny-outline',
    dark: 'moon-outline',
    system: 'phone-portrait-outline',
  };

  const handleThemeToggle = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIdx = themes.indexOf(theme);
    const nextTheme = themes[(currentIdx + 1) % themes.length];
    setTheme(nextTheme);
  };

  const settingsItems = [
    {
      id: 'theme',
      icon: themeIcons[theme] as keyof typeof Ionicons.glyphMap,
      label: t('mobile.profile.items.appearance'),
      color: colors.secondary,
      value: themeLabels[theme],
      onPress: handleThemeToggle,
    },
    {
      id: 'notifications',
      icon: 'notifications-outline' as const,
      label: t('mobile.profile.items.notifications'),
      color: colors.primary,
      onPress: () => router.push('/notifications' as Href),
    },
    {
      id: 'merchant-scan',
      icon: 'qr-code-outline' as const,
      label: t('mobile.profile.items.merchantScan'),
      color: colors.accent,
      onPress: () => router.push('/merchant-scan' as Href),
    },
    {
      id: 'language',
      icon: 'language-outline' as const,
      label: t('mobile.profile.items.language'),
      color: colors.secondary,
      value: currentLanguageName,
      onPress: () => setLanguageModalVisible(true),
    },
    {
      id: 'privacy',
      icon: 'shield-outline' as const,
      label: t('mobile.profile.items.privacy'),
      color: colors.accent,
    },
    {
      id: 'help',
      icon: 'help-circle-outline' as const,
      label: t('mobile.profile.items.help'),
      color: colors.warning,
    },
    {
      id: 'about',
      icon: 'information-circle-outline' as const,
      label: t('mobile.profile.items.about'),
      color: colors.text.secondary,
    },
  ];

  const handleLogout = () => {
    Alert.alert(t('mobile.profile.logout'), t('mobile.profile.logoutConfirm'), [
      { text: t('mobile.common.cancel'), style: 'cancel' },
      {
        text: t('mobile.profile.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleSettingsPress = (item: typeof settingsItems[0]) => {
    if (item.onPress) {
      item.onPress();
      return;
    }
    Alert.alert(item.label, t('mobile.common.comingSoon'));
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
          }}
        >
          <Text
            style={[typography.headingLarge, { color: colors.text.primary }]}
          >
            {t('mobile.profile.title')}
          </Text>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary + '10',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.push('/edit-profile' as Href)}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View
          style={{ alignItems: 'center', paddingVertical: spacing.md }}
        >
          <Image
            source={{
              uri: (displayUser as any)?.avatar_url || (displayUser as any)?.avatar || 'https://picsum.photos/seed/avatar/200/200',
            }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.surfaceSecondary,
              marginBottom: spacing.sm,
              borderWidth: 3,
              borderColor: colors.primary + '30',
            }}
          />
          <Text
            style={[typography.headingLarge, { color: colors.text.primary }]}
          >
            {displayUser?.name || t('mobile.profile.defaultUser')}
          </Text>
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.text.secondary, marginTop: spacing.xs },
            ]}
          >
            {displayUser?.email || ''}
          </Text>
        </View>

        {/* Stats */}
        <Card style={{ marginHorizontal: spacing.md, marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={[
                  typography.headingMedium,
                  { color: colors.text.primary },
                ]}
              >
                {adsViewed}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.tertiary, marginTop: 2 },
                ]}
              >
                {t('mobile.profile.stats.adsViewed')}
              </Text>
            </View>
            <View
              style={{ width: 1, height: 36, backgroundColor: colors.border }}
            />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={[
                  typography.headingMedium,
                  { color: colors.text.primary },
                ]}
              >
                ${totalEarned.toFixed(1)}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.tertiary, marginTop: 2 },
                ]}
              >
                {t('mobile.profile.stats.earned')}
              </Text>
            </View>
            <View
              style={{ width: 1, height: 36, backgroundColor: colors.border }}
            />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={[
                  typography.headingMedium,
                  { color: colors.text.primary },
                ]}
              >
                {joinedDate
                  ? new Date(joinedDate).toLocaleDateString(i18n.language, {
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.tertiary, marginTop: 2 },
                ]}
              >
                {t('mobile.profile.stats.joined')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Linked Devices */}
        <View
          style={{
            paddingHorizontal: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <Text
            style={[
              typography.headingSmall,
              { color: colors.text.primary, marginBottom: spacing.sm },
            ]}
          >
            {t('mobile.profile.linkedDevices')}
          </Text>
          <Card padded={false}>
            {[CURRENT_DEVICE].map((device) => (
              <View
                key={device.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.md,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.primary + '10',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: spacing.sm,
                  }}
                >
                  <Ionicons
                    name={deviceIcons[device.type]}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      typography.bodyMedium,
                      {
                        fontFamily: fontFamily.semibold,
                        color: colors.text.primary,
                      },
                    ]}
                  >
                    {deviceName}
                    {device.isCurrent && (
                      <Text
                        style={[
                          typography.bodySmall,
                          {
                            color: colors.accent,
                            fontFamily: fontFamily.medium,
                          },
                        ]}
                      >
                        {' '}
                        ({t('mobile.profile.currentDevice')})
                      </Text>
                    )}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.text.tertiary, marginTop: 2 },
                    ]}
                  >
                    {t('mobile.profile.lastActive')}{' '}
                    {new Date(device.lastActive).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.text.tertiary}
                />
              </View>
            ))}
          </Card>
        </View>

        {/* Settings */}
        <View
          style={{
            paddingHorizontal: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <Text
            style={[
              typography.headingSmall,
              { color: colors.text.primary, marginBottom: spacing.sm },
            ]}
          >
            {t('mobile.profile.settings')}
          </Text>
          <Card padded={false}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: spacing.md,
                  },
                  index < settingsItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                  },
                ]}
                onPress={() => handleSettingsPress(item)}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: spacing.sm,
                    backgroundColor: item.color + '15',
                  }}
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: colors.text.primary, flex: 1 },
                  ]}
                >
                  {item.label}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}
                >
                  {item.value && (
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: colors.text.tertiary },
                      ]}
                    >
                      {item.value}
                    </Text>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.text.tertiary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: spacing.md,
            paddingVertical: spacing.md,
            backgroundColor: colors.danger + '08',
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.danger + '20',
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[typography.button, { color: colors.danger }]}>
            {t('mobile.profile.logout')}
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            typography.caption,
            {
              color: colors.text.tertiary,
              textAlign: 'center',
              marginBottom: spacing.md,
            },
          ]}
        >
          SmartDeals v1.0.0
        </Text>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <Text
                style={[
                  typography.headingSmall,
                  {
                    color: colors.text.primary,
                    padding: spacing.md,
                    paddingBottom: spacing.sm,
                  },
                ]}
              >
                {t('mobile.profile.languageModal.title')}
              </Text>
              {Object.entries(languages).map(([code, lang], index, arr) => {
                const isSelected =
                  (i18n.resolvedLanguage ?? i18n.language) === code;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: spacing.md,
                        gap: spacing.sm,
                      },
                      index < arr.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                      },
                    ]}
                    onPress={() => {
                      setLanguage(code);
                      setLanguageModalVisible(false);
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
                    <Text
                      style={[
                        typography.bodyMedium,
                        { color: colors.text.primary, flex: 1 },
                        isSelected && { fontFamily: fontFamily.semibold },
                      ]}
                    >
                      {lang.name}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </Card>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
