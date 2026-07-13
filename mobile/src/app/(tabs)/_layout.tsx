import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { fontSize } from '@/theme/typography';
import { fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { useCurrentUser } from '@/hooks/useAuth';

export default function TabLayout() {
  const { t } = useTranslation();
  const colors = useColors();
  const storedUser = useAuthStore((s) => s.user);
  // Hydrate the user (with role) from the backend; fall back to the
  // login-time user object stored in the auth store.
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.role ?? storedUser?.role ?? 'end_user';
  const isAdvertiser = role !== 'end_user';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontFamily: fontFamily.semibold,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('mobile.tabs.home'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('mobile.tabs.search'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: t('mobile.tabs.rewards'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'gift' : 'gift-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: isAdvertiser ? undefined : null,
          title: t('mobile.tabs.dashboard'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('mobile.tabs.profile'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
