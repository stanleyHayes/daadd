import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Card } from '@/components/ui/Card';
import { spacing } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import { format } from 'date-fns';

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string, read: boolean) => {
    if (read) return; // Skip already-read notifications
    markAsRead.mutate(id);
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      reward: 'gift',
      campaign: 'megaphone',
      system: 'information-circle',
      invite: 'person-add',
    };
    return icons[type] || 'notifications';
  };

  const getNotificationColor = (type: string) => {
    const colorMap: Record<string, string> = {
      reward: colors.accent,
      campaign: colors.primary,
      system: colors.warning,
      invite: colors.secondary,
    };
    return colorMap[type] || colors.primary;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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
          Notifications
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            style={{ opacity: markAllRead.isPending ? 0.5 : 1 }}
          >
            <Text
              style={[
                typography.bodySmall,
                { color: colors.primary, fontFamily: fontFamily.semibold },
              ]}
            >
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
          }}
        >
          <Ionicons
            name="notifications-outline"
            size={64}
            color={colors.text.secondary}
            style={{ marginBottom: spacing.md }}
          />
          <Text
            style={[
              typography.headingMedium,
              { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.xs },
            ]}
          >
            No Notifications
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.text.secondary, textAlign: 'center' },
            ]}
          >
            You're all caught up! Check back later for updates.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleMarkAsRead(item.id, item.read)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
              }}
            >
              <Card
                style={{
                  flexDirection: 'row',
                  gap: spacing.md,
                  backgroundColor: item.read ? colors.background : colors.surfaceSecondary,
                  borderLeftWidth: 4,
                  borderLeftColor: item.read ? colors.border : getNotificationColor(item.type),
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: getNotificationColor(item.type) + '15',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name={getNotificationIcon(item.type)}
                    size={24}
                    color={getNotificationColor(item.type)}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      typography.labelMedium,
                      {
                        color: colors.text.primary,
                        marginBottom: spacing.xs,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.text.secondary, marginBottom: spacing.xs },
                    ]}
                  >
                    {item.message}
                  </Text>
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.text.secondary, fontSize: 12 },
                    ]}
                  >
                    {format(new Date(item.created_at), 'MMM d, h:mm a')}
                  </Text>
                </View>

                {!item.read && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.primary,
                    }}
                  />
                )}
              </Card>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingVertical: spacing.md }}
        />
      )}
    </SafeAreaView>
  );
}
