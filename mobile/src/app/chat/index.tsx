import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConversations, useChatSocket, ConversationSummary } from '@/hooks/useMessages';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';

function timeLabel(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ConversationsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: conversations = [], isLoading } = useConversations();
  useChatSocket();

  const renderItem = ({ item }: { item: ConversationSummary }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push(`/chat/${item.id}?title=${encodeURIComponent(item.counterpart.name)}` as Href)
      }
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: colors.primary + '15',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={[typography.bodyMedium, { color: colors.primary, fontFamily: fontFamily.bold }]}>
          {(item.counterpart.name || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            numberOfLines={1}
            style={[typography.bodyMedium, { color: colors.text.primary, fontFamily: fontFamily.semibold, flex: 1 }]}
          >
            {item.counterpart.name}
          </Text>
          <Text style={[typography.caption, { color: colors.text.tertiary, marginLeft: spacing.xs }]}>
            {timeLabel(item.last_message_at)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <Text numberOfLines={1} style={[typography.bodySmall, { color: colors.text.secondary, flex: 1 }]}>
            {item.last_message || '—'}
          </Text>
          {item.unread > 0 && (
            <View
              style={{
                minWidth: 20,
                height: 20,
                paddingHorizontal: 6,
                borderRadius: 10,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: spacing.xs,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 11, fontFamily: fontFamily.bold }}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.lg }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: borderRadius.full,
                backgroundColor: colors.surfaceSecondary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
            >
              <Ionicons name="chatbubbles-outline" size={30} color={colors.text.tertiary} />
            </View>
            <Text style={[typography.headingSmall, { color: colors.text.primary, marginBottom: spacing.xs }]}>
              {t('mobile.chat.emptyTitle')}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, textAlign: 'center' }]}>
              {t('mobile.chat.emptyMessage')}
            </Text>
          </View>
        }
        contentContainerStyle={conversations.length === 0 ? { flex: 1 } : { paddingVertical: spacing.sm }}
      />
    </View>
  );
}
