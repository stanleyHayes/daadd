import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useColors } from '@/hooks/useColors';
import { usePushNotifications } from '@/hooks/useNotifications';
import { SplashAnimated } from '@/components/SplashAnimated';
import { useTranslation } from 'react-i18next';
import { initI18n } from '@/i18n';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function PushNotificationsRegistrar() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  usePushNotifications(isAuthenticated);
  return null;
}

function RootLayoutInner() {
  const { t } = useTranslation();
  const colors = useColors();
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  const segments = useSegments();
  const router = useRouter();

  // Auth guard: redirect based on auth state once the store has hydrated
  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading, segments, router]);

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <PushNotificationsRegistrar />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="(auth)"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="ad/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: t('mobile.common.back'),
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen
          name="redeem"
          options={{
            headerShown: true,
            headerTitle: t('mobile.redeem.title'),
            headerBackTitle: t('mobile.common.back'),
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="merchant-scan"
          options={{
            headerShown: true,
            headerTitle: t('mobile.merchantScan.title'),
            headerBackTitle: t('mobile.common.back'),
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="dashboard/campaign/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: t('mobile.common.back'),
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen
          name="chat/index"
          options={{
            headerShown: true,
            headerTitle: t('mobile.chat.title'),
            headerBackTitle: t('mobile.common.back'),
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: t('mobile.common.back'),
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const initializeTheme = useThemeStore((s) => s.initialize);
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  useEffect(() => {
    initializeAuth();
    initializeTheme();
    initI18n();
  }, [initializeAuth, initializeTheme]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (showSplash) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SplashAnimated onFinish={() => setShowSplash(false)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutInner />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
