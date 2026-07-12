import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '@/lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  token = tokenResponse.data;

  return token;
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      setExpoPushToken(token);
      if (token) {
        try {
          await api.post('/notifications/register', { token, platform: Platform.OS });
        } catch {
          // Silent fail - will retry on next app open
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
      setNotification(n);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      // Handle notification tap - navigate to relevant screen
      if (data?.adId) {
        // router.push(`/ad/${data.adId}`);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notifications.Notification[]>([]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => subscription.remove();
  }, []);

  return { notifications };
}

export async function fetchNotifications() {
  try {
    const res = await api.get('/notifications');
    return res.data.data || [];
  } catch {
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await api.patch(`/notifications/${notificationId}/read`);
    return true;
  } catch {
    return false;
  }
}
