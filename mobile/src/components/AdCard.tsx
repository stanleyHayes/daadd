import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Ad } from '@/types';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { Badge } from './ui/Badge';
import { getIndustryById } from '@/constants/industries';

interface AdCardProps {
  ad: Ad;
  compact?: boolean;
}

export function AdCard({ ad, compact = false }: AdCardProps) {
  const router = useRouter();
  const colors = useColors();
  const scaleAnim = useSharedValue(1);
  const fadeAnim = useSharedValue(0);
  const industry = getIndustryById(ad.industry);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 400 });
  }, []);

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const handlePress = () => {
    router.push(`/ad/${ad.id}`);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: fadeAnim.value,
  }));

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.md,
              width: 160,
              marginRight: spacing.sm,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            },
            animatedStyle,
          ]}
        >
          <Image
            source={{ uri: ad.creativeUrl }}
            style={{
              width: '100%',
              height: 100,
              borderTopLeftRadius: borderRadius.md,
              borderTopRightRadius: borderRadius.md,
              backgroundColor: colors.surfaceSecondary,
            }}
          />
          <View style={{ padding: spacing.sm }}>
            <Text
              style={[
                typography.bodySmall,
                { fontFamily: fontFamily.semibold, color: colors.text.primary },
              ]}
              numberOfLines={1}
            >
              {ad.title}
            </Text>
            <Text
              style={[
                typography.caption,
                { color: colors.text.tertiary, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {ad.advertiser?.name || 'Advertiser'}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: spacing.xs,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="gift" size={12} color={colors.accent} />
                <Text
                  style={[
                    typography.caption,
                    { fontFamily: fontFamily.bold, color: colors.accent },
                  ]}
                >
                  ${(ad.rewardAmount ?? 0).toFixed(2)}
                </Text>
              </View>
              {ad.isTrending && (
                <Ionicons name="flame" size={14} color={colors.warning} />
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
            marginBottom: spacing.md,
          },
          animatedStyle,
        ]}
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: ad.creativeUrl }}
            style={{
              width: '100%',
              height: 180,
              borderTopLeftRadius: borderRadius.lg,
              borderTopRightRadius: borderRadius.lg,
              backgroundColor: colors.surfaceSecondary,
            }}
          />
          {ad.isTrending && (
            <View
              style={{
                position: 'absolute',
                top: spacing.sm,
                left: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.warning,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.full,
                gap: 4,
              }}
            >
              <Ionicons name="flame" size={14} color="#FFF" />
              <Text
                style={[
                  typography.caption,
                  { color: '#FFF', fontFamily: fontFamily.bold },
                ]}
              >
                Trending
              </Text>
            </View>
          )}
          <View
            style={{
              position: 'absolute',
              top: spacing.sm,
              right: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.accent,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.full,
              gap: 4,
            }}
          >
            <Ionicons name="gift" size={14} color="#FFF" />
            <Text
              style={[
                typography.caption,
                { color: '#FFF', fontFamily: fontFamily.bold },
              ]}
            >
              ${ad.rewardAmount.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={{ padding: spacing.md }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
          >
            <Text
              style={[typography.headingSmall, { color: colors.text.primary, flex: 1 }]}
              numberOfLines={2}
            >
              {ad.title}
            </Text>
            {ad.advertiser.verified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.primary}
              />
            )}
          </View>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.text.secondary, marginTop: spacing.xs },
            ]}
          >
            {ad.advertiser.name}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: spacing.sm,
            }}
          >
            {industry && (
              <Badge
                label={industry.label}
                backgroundColor={industry.color + '20'}
                color={industry.color}
                size="sm"
              />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text
                style={[
                  typography.bodySmall,
                  { fontFamily: fontFamily.semibold, color: colors.text.secondary },
                ]}
              >
                {ad.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
