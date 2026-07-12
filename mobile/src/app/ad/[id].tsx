import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useAd } from '@/hooks/useAds';
import { useClaimReward } from '@/hooks/useRewards';
import { useReviews, useReviewSummary } from '@/hooks/useReviews';
import api from '@/lib/api';
import { AgeGate } from '@/components/AgeGate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { FadeIn } from '@/components/ui/FadeIn';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { getIndustryById } from '@/constants/industries';
import { Review } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.65;

const AnimatedScrollView = Animated.ScrollView;

export default function AdDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: ad, isLoading } = useAd(id ?? '');
  const { data: reviews = [] } = useReviews(id ?? '');
  const { data: reviewSummary } = useReviewSummary(id ?? '');
  const claimReward = useClaimReward();
  const colors = useColors();
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  // Scroll-based parallax for hero image
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroImageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
      [-IMAGE_HEIGHT / 2, 0, IMAGE_HEIGHT * 0.3],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [-IMAGE_HEIGHT, 0],
      [2, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  // Claim button slide-up entrance
  const claimSlideY = useSharedValue(80);
  const claimOpacity = useSharedValue(0);

  useEffect(() => {
    claimSlideY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 120 }));
    claimOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
  }, []);

  const claimFooterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: claimSlideY.value }],
    opacity: claimOpacity.value,
  }));

  // Claim button press scale
  const claimScale = useSharedValue(1);
  const claimScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: claimScale.value }],
  }));

  if (isLoading || !ad) {
    return <LoadingScreen message="Loading ad..." />;
  }

  const industry = getIndustryById(ad.industry);

  const handleClaimReward = async () => {
    if (ad.isAgeRestricted && !ageVerified) {
      setShowAgeGate(true);
      return;
    }

    claimScale.value = withSpring(0.92, { damping: 10, stiffness: 300 });
    setTimeout(() => {
      claimScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    }, 100);

    try {
      await claimReward.mutateAsync(ad.id);
      Alert.alert(
        'Reward Claimed!',
        `You've earned $${ad.rewardAmount.toFixed(2)} from ${ad.advertiser.name}. It will be credited to your balance shortly.`,
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to claim reward. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleAgeVerify = async (code: string) => {
    try {
      // Validate age verification code with backend
      const res = await api.post('/auth/age-verify/confirm', { otp: code });
      if (res.data.data?.verified) {
        setAgeVerified(true);
        setShowAgeGate(false);
        handleClaimReward();
      } else {
        Alert.alert('Verification Failed', 'Invalid or expired verification code. Please try again.');
      }
    } catch (error) {
      Alert.alert('Verification Failed', 'Invalid or expired verification code. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ad on AdPlatform: ${ad.title} - Earn $${ad.rewardAmount.toFixed(2)}!`,
        url: `adplatform://ad/${ad.id}`,
      });
    } catch {
      // Share cancelled
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={
          i < Math.floor(rating)
            ? 'star'
            : i < rating
            ? 'star-half'
            : 'star-outline'
        }
        size={14}
        color={colors.warning}
      />
    ));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Creative Image with Parallax */}
        <View style={{ position: 'relative', overflow: 'hidden', height: IMAGE_HEIGHT }}>
          <Animated.Image
            source={{ uri: ad.creativeUrl }}
            style={[
              {
                width: SCREEN_WIDTH,
                height: IMAGE_HEIGHT,
                backgroundColor: colors.surfaceSecondary,
              },
              heroImageStyle,
            ]}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 80,
            }}
          />
          {ad.isTrending && (
            <View
              style={{
                position: 'absolute',
                bottom: spacing.sm,
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
        </View>

        {/* Reward Banner */}
        <LinearGradient
          colors={colors.gradient.reward as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Ionicons name="gift" size={20} color="#FFF" />
            <Text style={[typography.headingMedium, { color: '#FFF' }]}>
              Earn ${ad.rewardAmount.toFixed(2)} {ad.rewardCurrency}
            </Text>
          </View>
          <Text
            style={[
              typography.bodySmall,
              {
                color: 'rgba(255,255,255,0.8)',
                marginTop: spacing.xs,
                marginLeft: 28,
              },
            ]}
          >
            View this ad to claim your reward
          </Text>
        </LinearGradient>

        {/* Campaign Info */}
        <FadeIn delay={100}>
          <View style={{ padding: spacing.md }}>
            <Text
              style={[
                typography.displaySmall,
                { color: colors.text.primary, marginBottom: spacing.md },
              ]}
            >
              {ad.title}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
            >
              {ad.advertiser.logo && (
                <Image
                  source={{ uri: ad.advertiser.logo }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.surfaceSecondary,
                    marginRight: spacing.sm,
                  }}
                />
              )}
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}
                >
                  <Text
                    style={[
                      typography.headingSmall,
                      { color: colors.text.primary },
                    ]}
                  >
                    {ad.advertiser.name}
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
                    { color: colors.text.secondary, marginTop: 2 },
                  ]}
                >
                  {ad.campaign.name}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}
            >
              {industry && (
                <Badge
                  label={industry.label}
                  backgroundColor={industry.color + '20'}
                  color={industry.color}
                />
              )}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Ionicons
                    name="eye-outline"
                    size={14}
                    color={colors.text.tertiary}
                  />
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {(ad.viewCount / 1000).toFixed(1)}k views
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {ad.rating.toFixed(1)} ({ad.reviewCount})
                  </Text>
                </View>
              </View>
            </View>

            <Text
              style={[
                typography.bodyLarge,
                { color: colors.text.secondary, lineHeight: 26 },
              ]}
            >
              {ad.description}
            </Text>

            {ad.isAgeRestricted && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  backgroundColor: colors.warning + '15',
                  padding: spacing.sm,
                  borderRadius: borderRadius.md,
                  marginTop: spacing.md,
                }}
              >
                <Ionicons name="warning" size={16} color={colors.warning} />
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      color: colors.warningDark,
                      fontFamily: fontFamily.semibold,
                    },
                  ]}
                >
                  Age restricted: {ad.minAge}+ only
                </Text>
              </View>
            )}
          </View>
        </FadeIn>

        {/* Share Button */}
        <FadeIn delay={200}>
          <View
            style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}
          >
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.primary + '30',
                backgroundColor: colors.primary + '08',
              }}
              onPress={handleShare}
            >
              <Ionicons
                name="share-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.primary, fontFamily: fontFamily.semibold },
                ]}
              >
                Share this ad
              </Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Reviews Section */}
        <FadeIn delay={300}>
          <View style={{ padding: spacing.md }}>
            <Text
              style={[
                typography.headingMedium,
                { color: colors.text.primary, marginBottom: spacing.sm },
              ]}
            >
              Reviews & Ratings
            </Text>

            {/* Rating Summary */}
            <Card style={{ marginBottom: spacing.md }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <Text
                  style={{
                    fontSize: 40,
                    fontFamily: fontFamily.extrabold,
                    color: colors.text.primary,
                  }}
                >
                  {reviewSummary ? reviewSummary.average_rating.toFixed(1) : '0.0'}
                </Text>
                <View style={{ gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {renderStars(reviewSummary ? reviewSummary.average_rating : 0)}
                  </View>
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {reviewSummary ? reviewSummary.total_reviews : 0} {reviewSummary?.total_reviews === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Reviews List */}
            {reviews && reviews.length > 0 ? reviews.map((review, idx) => (
              <FadeIn key={review.id} delay={350 + idx * 80}>
                <Card style={{ marginBottom: spacing.sm }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: spacing.sm,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: colors.primary + '15',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={[
                            typography.bodyMedium,
                            {
                              fontFamily: fontFamily.bold,
                              color: colors.primary,
                            },
                          ]}
                        >
                          {review.userName[0]}
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={[
                            typography.bodyMedium,
                            {
                              fontFamily: fontFamily.semibold,
                              color: colors.text.primary,
                            },
                          ]}
                        >
                          {review.userName}
                        </Text>
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.text.tertiary },
                          ]}
                        >
                          {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {renderStars(review.rating)}
                    </View>
                  </View>
                  <Text
                    style={[
                      typography.bodyMedium,
                      { color: colors.text.secondary, lineHeight: 22 },
                    ]}
                  >
                    {review.comment}
                  </Text>
                </Card>
              </FadeIn>
            )) : (
              <Text style={[typography.bodySmall, { color: colors.text.secondary, textAlign: 'center', marginVertical: spacing.lg }]}>
                No reviews yet. Be the first to share your thoughts!
              </Text>
            )}
          </View>
        </FadeIn>
      </AnimatedScrollView>

      {/* Claim Reward Button - Sticky Footer with slide-up entrance */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            paddingBottom: Math.max(spacing.lg, insets.bottom),
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 10,
            gap: spacing.md,
          },
          claimFooterStyle,
        ]}
      >
        <View style={{ alignItems: 'center' }}>
          <Text
            style={[typography.caption, { color: colors.text.tertiary }]}
          >
            Reward
          </Text>
          <Text
            style={[typography.headingLarge, { color: colors.accent }]}
          >
            ${ad.rewardAmount.toFixed(2)}
          </Text>
        </View>
        <Animated.View style={[{ flex: 1 }, claimScaleStyle]}>
          <Button
            title="Claim Reward"
            onPress={handleClaimReward}
            loading={claimReward.isPending}
            size="lg"
            icon={
              <Ionicons name="gift" size={20} color={colors.text.inverse} />
            }
            style={{ flex: 1 }}
          />
        </Animated.View>
      </Animated.View>

      {/* Age Gate Modal */}
      <AgeGate
        visible={showAgeGate}
        minAge={ad.minAge || 18}
        onVerify={handleAgeVerify}
        onClose={() => setShowAgeGate(false)}
      />
    </View>
  );
}
