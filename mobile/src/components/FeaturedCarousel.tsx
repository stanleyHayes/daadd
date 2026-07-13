import React, { useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  Dimensions,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Ad } from '@/types';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2;

const AnimatedScrollView = Animated.ScrollView;

interface FeaturedCarouselProps {
  ads: Ad[];
}

function CarouselCard({
  ad,
  index,
  scrollX,
}: {
  ad: Ad;
  index: number;
  scrollX: SharedValue<number>;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardOffset = index * (CARD_WIDTH + spacing.sm);

  const animatedImageStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [cardOffset - CARD_WIDTH, cardOffset, cardOffset + CARD_WIDTH],
      [-30, 0, 30],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollX.value,
      [cardOffset - CARD_WIDTH, cardOffset, cardOffset + CARD_WIDTH],
      [0.95, 1, 0.95],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX }, { scale }],
    };
  });

  return (
    <Pressable
      onPress={() => router.push(`/ad/${ad.id}`)}
      style={{
        width: CARD_WIDTH,
        height: 220,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginRight: spacing.sm,
      }}
    >
      <Animated.Image
        source={{ uri: ad.creativeUrl }}
        style={[
          {
            width: '110%',
            height: '100%',
            backgroundColor: colors.surfaceSecondary,
          },
          animatedImageStyle,
        ]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'flex-end',
        }}
      >
        <View style={{ padding: spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.accent,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.full,
              alignSelf: 'flex-start',
              gap: 4,
              marginBottom: spacing.sm,
            }}
          >
            <Ionicons name="gift" size={14} color="#FFF" />
            <Text
              style={[
                typography.caption,
                { color: '#FFF', fontFamily: fontFamily.bold },
              ]}
            >
              {t('mobile.adDetail.earnReward', {
                amount: ad.rewardAmount.toFixed(2),
                currency: '',
              }).trim()}
            </Text>
          </View>
          <Text
            style={[typography.headingLarge, { color: '#FFF' }]}
            numberOfLines={2}
          >
            {ad.title}
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
            ]}
          >
            {ad.advertiser.name}
            {ad.advertiser.verified && ' \u2713'}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export function FeaturedCarousel({ ads }: FeaturedCarouselProps) {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const safeAds = Array.isArray(ads) ? ads : [];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIndex(index);
  };

  if (!safeAds.length) return null;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AnimatedScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.sm}
        contentContainerStyle={{ paddingHorizontal: spacing.md }}
      >
        {safeAds.map((ad, index) => (
          <CarouselCard
            key={ad.id}
            ad={ad}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </AnimatedScrollView>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: spacing.sm,
          gap: spacing.xs,
        }}
      >
        {safeAds.map((_, index) => (
          <View
            key={index}
            style={[
              {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.border,
              },
              activeIndex === index && {
                backgroundColor: colors.primary,
                width: 24,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}
