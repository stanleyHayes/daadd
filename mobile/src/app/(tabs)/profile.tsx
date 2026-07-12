import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useLogout } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { LinkedDevice } from '@/types';

// Placeholder data
const MOCK_USER = {
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  avatar: 'https://picsum.photos/seed/avatar/200/200',
  stats: {
    adsViewed: 142,
    totalRewardsEarned: 86.5,
    currentBalance: 24.5,
    joinedDate: '2023-09-15',
  },
};

const MOCK_DEVICES: LinkedDevice[] = [
  {
    id: 'd1',
    name: 'iPhone 15 Pro',
    type: 'phone',
    lastActive: '2024-03-14T10:00:00Z',
    isCurrent: true,
  },
  {
    id: 'd2',
    name: 'iPad Air',
    type: 'tablet',
    lastActive: '2024-03-13T22:00:00Z',
    isCurrent: false,
  },
  {
    id: 'd3',
    name: 'Samsung TV',
    type: 'tv',
    lastActive: '2024-03-10T20:00:00Z',
    isCurrent: false,
  },
];

const deviceIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  phone: 'phone-portrait',
  tablet: 'tablet-portrait',
  tv: 'tv',
};

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useThemeStore();

  const displayUser = user || MOCK_USER;

  const themeLabels: Record<string, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
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
      label: 'Appearance',
      color: colors.secondary,
      value: themeLabels[theme],
      onPress: handleThemeToggle,
    },
    {
      id: 'notifications',
      icon: 'notifications-outline' as const,
      label: 'Notifications',
      color: colors.primary,
      onPress: () => router.push('/notifications' as Href),
    },
    {
      id: 'language',
      icon: 'language-outline' as const,
      label: 'Language',
      color: colors.secondary,
      value: 'English',
    },
    {
      id: 'privacy',
      icon: 'shield-outline' as const,
      label: 'Privacy',
      color: colors.accent,
    },
    {
      id: 'help',
      icon: 'help-circle-outline' as const,
      label: 'Help & Support',
      color: colors.warning,
    },
    {
      id: 'about',
      icon: 'information-circle-outline' as const,
      label: 'About AdPlatform',
      color: colors.text.secondary,
    },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
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
    Alert.alert(item.label, 'This feature is coming soon!');
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
            Profile
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
              uri: (displayUser as any).avatar || MOCK_USER.avatar,
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
            {displayUser.name}
          </Text>
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.text.secondary, marginTop: spacing.xs },
            ]}
          >
            {displayUser.email}
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
                {(displayUser as any).stats?.adsViewed ??
                  MOCK_USER.stats.adsViewed}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.tertiary, marginTop: 2 },
                ]}
              >
                Ads Viewed
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
                $
                {(displayUser as any).stats?.totalRewardsEarned?.toFixed(1) ??
                  MOCK_USER.stats.totalRewardsEarned}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.tertiary, marginTop: 2 },
                ]}
              >
                Earned
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
                {(displayUser as any).stats?.joinedDate
                  ? new Date(
                      (displayUser as any).stats.joinedDate
                    ).toLocaleDateString('en', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Sep 2023'}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.tertiary, marginTop: 2 },
                ]}
              >
                Joined
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
            Linked Devices
          </Text>
          <Card padded={false}>
            {MOCK_DEVICES.map((device, index) => (
              <View
                key={device.id}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: spacing.md,
                  },
                  index < MOCK_DEVICES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                  },
                ]}
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
                    {device.name}
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
                        (Current)
                      </Text>
                    )}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.text.tertiary, marginTop: 2 },
                    ]}
                  >
                    Last active:{' '}
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
            Settings
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
            Logout
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
          AdPlatform v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
