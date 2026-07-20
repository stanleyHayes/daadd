import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  useConversation,
  useSendMessage,
  useStartConversation,
  useChatSocket,
  useTyping,
  ChatMessage,
  ChatImage,
} from '@/hooks/useMessages';
import { useAuthStore } from '@/stores/auth.store';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useTranslation } from 'react-i18next';

export default function ChatThreadScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    advertiserId?: string;
    advertiserName?: string;
    adId?: string;
    campaignId?: string;
  }>();

  const isCompose = params.id === 'new';
  const [activeId, setActiveId] = useState<string | undefined>(isCompose ? undefined : params.id);
  const [draft, setDraft] = useState('');
  const [image, setImage] = useState<ChatImage | null>(null);

  const { data: messages = [] } = useConversation(activeId);
  const sendMessage = useSendMessage(activeId ?? '');
  const startConversation = useStartConversation();
  useChatSocket();
  const { isCounterpartTyping, notifyTyping } = useTyping(activeId);

  const busy = sendMessage.isPending || startConversation.isPending;
  const title = params.title || params.advertiserName || t('mobile.chat.title');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        name: asset.fileName || `photo-${asset.uri.split('/').pop()}`,
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && !image) || busy) return;
    try {
      if (!activeId) {
        if (!params.advertiserId) return;
        const result = await startConversation.mutateAsync({
          advertiser_id: params.advertiserId,
          body: text,
          ad_id: params.adId,
          campaign_id: params.campaignId,
          image: image ?? undefined,
        });
        setActiveId(result.conversation_id);
      } else {
        await sendMessage.mutateAsync({ body: text, image: image ?? undefined });
      }
      setDraft('');
      setImage(null);
    } catch {
      // Surface via the disabled state; a toast could be added later.
    }
  };

  // Inverted list wants newest first.
  const ordered = [...messages].reverse();

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.sender_id === me?.id;
    return (
      <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', paddingHorizontal: spacing.md, marginVertical: 3 }}>
        <View
          style={{
            maxWidth: '78%',
            backgroundColor: mine ? colors.primary : colors.surfaceSecondary,
            borderRadius: borderRadius.lg,
            borderBottomRightRadius: mine ? 4 : borderRadius.lg,
            borderBottomLeftRadius: mine ? borderRadius.lg : 4,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          {!!item.image_url && (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: 200, height: 200, borderRadius: borderRadius.md, marginBottom: item.body ? spacing.xs : 0 }}
              resizeMode="cover"
            />
          )}
          {!!item.body && (
            <Text style={[typography.bodyMedium, { color: mine ? '#FFF' : colors.text.primary }]}>{item.body}</Text>
          )}
          <Text style={[typography.caption, { color: mine ? 'rgba(255,255,255,0.7)' : colors.text.tertiary, marginTop: 2, textAlign: 'right' }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerTitle: title }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={ordered}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={{ paddingVertical: spacing.md }}
          ListEmptyComponent={
            <View style={{ transform: [{ scaleY: -1 }], alignItems: 'center', paddingTop: spacing.xxl }}>
              <Text style={[typography.bodySmall, { color: colors.text.tertiary }]}>
                {t('mobile.chat.startPrompt')}
              </Text>
            </View>
          }
        />

        {isCounterpartTyping && (
          <Text
            style={[
              typography.caption,
              { paddingHorizontal: spacing.md, paddingBottom: spacing.xs, color: colors.text.tertiary, fontStyle: 'italic' },
            ]}
          >
            {t('mobile.chat.typing')}
          </Text>
        )}
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: Math.max(spacing.sm, insets.bottom),
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          {image && (
            <View style={{ width: 64, marginBottom: spacing.sm }}>
              <Image source={{ uri: image.uri }} style={{ width: 64, height: 64, borderRadius: borderRadius.md }} />
              <TouchableOpacity
                onPress={() => setImage(null)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.text.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="close" size={12} color={colors.background} />
              </TouchableOpacity>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
            <TouchableOpacity
              onPress={pickImage}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surfaceSecondary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="image-outline" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TextInput
              value={draft}
              onChangeText={(txt) => {
                setDraft(txt);
                notifyTyping();
              }}
              placeholder={t('mobile.chat.inputPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              multiline
              style={[
                typography.bodyMedium,
                {
                  flex: 1,
                  maxHeight: 120,
                  color: colors.text.primary,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={(!draft.trim() && !image) || busy}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: (!draft.trim() && !image) || busy ? 0.5 : 1,
              }}
            >
              <Ionicons name="send" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
