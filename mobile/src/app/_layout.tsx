import React, { useEffect, useCallback, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useColors } from '@/hooks/useColors';
import { SplashAnimated } from '@/components/SplashAnimated';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutInner() {
  const colors = useColors();
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
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
            headerBackTitle: 'Back',
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
            animation: 'fade_from_bottom',
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
    'EuclidA-Light': require('../../assets/fonts/Euclid Circular A Light.ttf'),
    'EuclidA-Regular': require('../../assets/fonts/Euclid Circular A Regular.ttf'),
    'EuclidA-Medium': require('../../assets/fonts/Euclid Circular A Medium.ttf'),
    'EuclidA-Semibold': require('../../assets/fonts/Euclid Circular A SemiBold.ttf'),
    'EuclidA-Bold': require('../../assets/fonts/Euclid Circular A Bold.ttf'),
  });

  useEffect(() => {
    initializeAuth();
    initializeTheme();
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
