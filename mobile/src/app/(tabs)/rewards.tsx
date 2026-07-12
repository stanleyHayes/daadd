import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRewards, useRewardBalance } from '@/hooks/useRewards';
import { RewardCard } from '@/components/RewardCard';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { RewardStatus } from '@/types';

type FilterOption = 'all' | RewardStatus;

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'credited', label: 'Credited' },
  { value: 'redeemed', label: 'Redeemed' },
];

export default function RewardsScreen() {
  const colors = useColors();
  const { data: rewards, isLoading: rewardsLoading } = useRewards();
  const { data: balance, isLoading: balanceLoading } = useRewardBalance();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  // Balance card entrance animation
  const balanceSlideY = useSharedValue(40);
  const balanceOpacity = useSharedValue(0);

  useEffect(() => {
    balanceSlideY.value = withSpring(0, { damping: 15, stiffness: 120 });
    balanceOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const balanceAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: balanceSlideY.value }],
    opacity: balanceOpacity.value,
  }));

  const rewardsList = Array.isArray(rewards) ? rewards : [];
  const filteredRewards = rewardsList.filter(
    (r) => activeFilter === 'all' || r.status === activeFilter
  );

  const handleRedeem = () => {
    Alert.alert(
      'Redeem Rewards',
      `Redeem $${(balance?.balance ?? 0).toFixed(2)} to your linked payment method?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => Alert.alert('Success', 'Redemption request submitted!'),
        },
      ]
    );
  };

  if (rewardsLoading && balanceLoading) {
    return <LoadingScreen message="Loading rewards..." />;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
          }}
        >
          <Text
            style={[typography.headingLarge, { color: colors.text.primary }]}
          >
            My Rewards
          </Text>
        </View>

        {/* Balance Card */}
        <Animated.View
          style={[{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }, balanceAnimStyle]}
        >
          <LinearGradient
            colors={colors.gradient.reward as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: borderRadius.xl, padding: spacing.lg }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="wallet" size={24} color="#FFF" />
              </View>
              <Text
                style={[
                  typography.bodyMedium,
                  { color: 'rgba(255,255,255,0.8)' },
                ]}
              >
                Available Balance
              </Text>
            </View>
            <Text
              style={{
                fontSize: 48,
                fontFamily: fontFamily.extrabold,
                color: '#FFF',
                lineHeight: 56,
              }}
            >
              ${(balance?.balance ?? 0).toFixed(2)}
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                { color: 'rgba(255,255,255,0.6)', marginBottom: spacing.md },
              ]}
            >
              {balance?.currency || 'USD'}
            </Text>
            <Button
              title="Redeem Rewards"
              onPress={handleRedeem}
              variant="outline"
              style={{
                borderColor: 'rgba(255,255,255,0.4)',
                backgroundColor: 'rgba(255,255,255,0.15)',
              }}
              textStyle={{ color: '#FFF' }}
            />
          </LinearGradient>
        </Animated.View>

        {/* Stats Row */}
        <FadeIn delay={150}>
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginBottom: spacing.lg,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={[
                  typography.headingLarge,
                  { color: colors.text.primary },
                ]}
              >
                {rewardsList.filter((r) => r.status === 'pending').length || 0}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.tertiary, marginTop: 2 },
                ]}
              >
                Pending
              </Text>
            </View>
            <View
              style={{
                width: 1,
                backgroundColor: colors.border,
                marginVertical: spacing.xs,
              }}
            />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={[
                  typography.headingLarge,
                  { color: colors.text.primary },
                ]}
              >
                {rewardsList.filter((r) => r.status === 'credited').length || 0}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.tertiary, marginTop: 2 },
                ]}
              >
                Credited
              </Text>
            </View>
            <View
              style={{
                width: 1,
                backgroundColor: colors.border,
                marginVertical: spacing.xs,
              }}
            />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={[
                  typography.headingLarge,
                  { color: colors.text.primary },
                ]}
              >
                {rewardsList.filter((r) => r.status === 'redeemed').length || 0}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.tertiary, marginTop: 2 },
                ]}
              >
                Redeemed
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
            gap: spacing.sm,
          }}
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.surfaceSecondary,
                },
                activeFilter === option.value && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setActiveFilter(option.value)}
            >
              <Text
                style={[
                  typography.bodySmall,
                  {
                    fontFamily: fontFamily.semibold,
                    color: colors.text.secondary,
                  },
                  activeFilter === option.value && {
                    color: colors.text.inverse,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rewards List */}
        <View style={{ paddingHorizontal: spacing.md }}>
          <Text
            style={[
              typography.headingSmall,
              { color: colors.text.primary, marginBottom: spacing.sm },
            ]}
          >
            Reward History
          </Text>
          {filteredRewards && filteredRewards.length > 0 ? (
            filteredRewards.map((reward, index) => (
              <RewardCard key={reward.id} reward={reward} index={index} />
            ))
          ) : (
            <EmptyState
              icon="gift-outline"
              title="No rewards yet"
              message="Start viewing ads to earn rewards!"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
