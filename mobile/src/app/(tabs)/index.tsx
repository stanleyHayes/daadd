import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFeaturedAds, useTrendingAds, useAds } from '@/hooks/useAds';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { AdCard } from '@/components/AdCard';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { FadeIn } from '@/components/ui/FadeIn';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { industries } from '@/constants/industries';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { data: featuredAds, isLoading: featuredLoading } = useFeaturedAds();
  const { data: trendingAds, isLoading: trendingLoading } = useTrendingAds();
  const { data: allAds } = useAds();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (featuredLoading && trendingLoading) {
    return <LoadingScreen message={t('mobile.home.loadingAds')} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
          }}
        >
          <View>
            <Text
              style={[typography.bodyMedium, { color: colors.text.secondary }]}
            >
              {t('mobile.home.welcomeTo')}
            </Text>
            <Text style={[typography.displaySmall, { color: colors.primary }]}>
              AdPlatform
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surfaceSecondary,
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.text.primary}
            />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  paddingHorizontal: 3,
                  backgroundColor: colors.danger,
                  borderWidth: 1.5,
                  borderColor: colors.surfaceSecondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#FFF',
                    fontSize: 9,
                    fontFamily: fontFamily.bold,
                    lineHeight: 12,
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Featured Carousel */}
        <FadeIn delay={0}>
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={[
                typography.headingMedium,
                {
                  color: colors.text.primary,
                  paddingHorizontal: spacing.md,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              {t('mobile.home.featuredAds')}
            </Text>
            <FeaturedCarousel ads={Array.isArray(featuredAds) ? featuredAds : []} />
          </View>
        </FadeIn>

        {/* Trending Ads */}
        <FadeIn delay={100}>
          <View style={{ marginBottom: spacing.lg }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                marginBottom: spacing.sm,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                <Ionicons name="flame" size={20} color={colors.warning} />
                <Text
                  style={[
                    typography.headingMedium,
                    {
                      color: colors.text.primary,
                      paddingHorizontal: 0,
                      marginBottom: 0,
                    },
                  ]}
                >
                  {t('mobile.home.trendingNow')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/search')}>
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: colors.primary, fontFamily: fontFamily.semibold },
                  ]}
                >
                  {t('mobile.home.seeAll')}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
            >
              {(Array.isArray(trendingAds) ? trendingAds : []).map((ad) => (
                <View key={ad.id} style={{ width: 200, marginRight: spacing.sm }}>
                  <AdCard ad={ad} compact />
                </View>
              ))}
            </ScrollView>
          </View>
        </FadeIn>

        {/* Categories */}
        <FadeIn delay={200}>
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={[
                typography.headingMedium,
                {
                  color: colors.text.primary,
                  paddingHorizontal: spacing.md,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              {t('mobile.home.browseByCategory')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                paddingHorizontal: spacing.md,
                justifyContent: 'space-between',
              }}
            >
              {industries.slice(0, 8).map((industry, idx) => (
                <FadeIn key={industry.id} delay={250 + idx * 50}>
                  <TouchableOpacity
                    style={{
                      width: 80,
                      alignItems: 'center',
                      marginBottom: spacing.md,
                    }}
                    onPress={() =>
                      router.push({
                        pathname: '/search',
                        params: { industry: industry.id },
                      })
                    }
                  >
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: spacing.xs,
                        backgroundColor: industry.color + '15',
                      }}
                    >
                      <Ionicons
                        name={industry.icon as any}
                        size={24}
                        color={industry.color}
                      />
                    </View>
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.text.secondary, textAlign: 'center' },
                      ]}
                      numberOfLines={1}
                    >
                      {t(`mobile.industries.${industry.id}`)}
                    </Text>
                  </TouchableOpacity>
                </FadeIn>
              ))}
            </View>
          </View>
        </FadeIn>

        {/* Browse All */}
        <FadeIn delay={400}>
          <View style={{ marginBottom: spacing.lg }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                marginBottom: spacing.sm,
              }}
            >
              <Text
                style={[
                  typography.headingMedium,
                  {
                    color: colors.text.primary,
                    paddingHorizontal: 0,
                    marginBottom: 0,
                  },
                ]}
              >
                {t('mobile.home.recentAds')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/search')}>
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: colors.primary, fontFamily: fontFamily.semibold },
                  ]}
                >
                  {t('mobile.home.browseAll')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: spacing.md }}>
              {(Array.isArray(allAds) ? allAds : Array.isArray(allAds?.data) ? allAds.data : []).slice(0, 4).map((ad, idx) => (
                <FadeIn key={ad.id} delay={450 + idx * 80}>
                  <AdCard ad={ad} />
                </FadeIn>
              ))}
            </View>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}
