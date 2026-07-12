import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Reward } from '@/types';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { StatusBadge } from './ui/Badge';

interface RewardCardProps {
  reward: Reward;
  index?: number;
}

export function RewardCard({ reward, index = 0 }: RewardCardProps) {
  const colors = useColors();
  const translateX = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 80;
    translateX.value = withDelay(delay, withTiming(0, { duration: 400 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: colors.surface,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.accent + '15',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: spacing.sm,
        }}
      >
        <Ionicons name="gift" size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={[
              typography.bodyMedium,
              {
                fontFamily: fontFamily.semibold,
                color: colors.text.primary,
                flex: 1,
                marginRight: spacing.sm,
              },
            ]}
            numberOfLines={1}
          >
            {reward.campaignName}
          </Text>
          <Text style={[typography.headingSmall, { color: colors.accent }]}>
            +${reward.amount.toFixed(2)}
          </Text>
        </View>
        <Text
          style={[
            typography.bodySmall,
            { color: colors.text.secondary, marginTop: 2 },
          ]}
          numberOfLines={1}
        >
          {reward.adTitle}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.sm,
          }}
        >
          <Text style={[typography.caption, { color: colors.text.tertiary }]}>
            {format(new Date(reward.claimedAt), 'MMM d, yyyy')}
          </Text>
          <StatusBadge status={reward.status} />
        </View>
      </View>
    </Animated.View>
  );
}
