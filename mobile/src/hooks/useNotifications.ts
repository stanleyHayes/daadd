import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  // Push notifications are not supported on web
  if (Platform.OS === 'web') {
    return null;
  }

  try {
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
    return tokenResponse.data;
  } catch {
    // Simulator / missing EAS project config - push not available
    return null;
  }
}

export function usePushNotifications(enabled = true) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') {
      return;
    }

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
  }, [enabled]);

  return { expoPushToken, notification };
}

export function usePushNotificationListener() {
  const [notifications, setNotifications] = useState<Notifications.Notification[]>([]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => subscription.remove();
  }, []);

  return { notifications };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Backend returns paginated { success, data: [...], meta } with snake_case fields
// and Mongo `_id` - normalize to a flat list with `id` + `read`.
function normalizeNotification(raw: any): NotificationItem {
  return {
    id: String(raw.id ?? raw._id),
    type: raw.type ?? 'system',
    title: raw.title ?? '',
    message: raw.message ?? '',
    read: Boolean(raw.read ?? raw.is_read ?? false),
    created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<NotificationItem[]> => {
      const res = await api.get('/notifications', { params: { limit: 100 } });
      const list = res.data?.data;
      return (Array.isArray(list) ? list : []).map(normalizeNotification);
    },
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
