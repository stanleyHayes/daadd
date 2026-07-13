import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useInfiniteAds } from '@/hooks/useAds';
import { AdCard } from '@/components/AdCard';
import { CategoryChip } from '@/components/CategoryChip';
import { Input } from '@/components/ui/Input';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { industries } from '@/constants/industries';
import { IndustryType, AdFilters } from '@/types';
import { useTranslation } from 'react-i18next';

type SortOption = 'trending' | 'newest' | 'reward_value';

const sortOptions: { value: SortOption; labelKey: string; icon: string }[] = [
  { value: 'trending', labelKey: 'trending', icon: 'flame' },
  { value: 'newest', labelKey: 'newest', icon: 'time' },
  { value: 'reward_value', labelKey: 'rewardValue', icon: 'cash' },
];

interface SearchListHeaderProps {
  colors: ReturnType<typeof useColors>;
  selectedIndustry: IndustryType | undefined;
  selectedSort: SortOption;
  totalResults: number;
  onIndustryPress: (id: IndustryType) => void;
  onSortChange: (sort: SortOption) => void;
}

function SearchListHeader({
  colors,
  selectedIndustry,
  selectedSort,
  totalResults,
  onIndustryPress,
  onSortChange,
}: SearchListHeaderProps) {
  const { t } = useTranslation();
  return (
    <View>
      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        {industries.map((industry) => (
          <CategoryChip
            key={industry.id}
            label={t(`mobile.industries.${industry.id}`)}
            icon={industry.icon as any}
            color={industry.color}
            selected={selectedIndustry === industry.id}
            onPress={() => onIndustryPress(industry.id)}
          />
        ))}
      </ScrollView>

      {/* Sort Options */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <Text
          style={[
            typography.bodySmall,
            { color: colors.text.secondary, marginRight: spacing.sm },
          ]}
        >
          {t('mobile.search.sortBy')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing.sm + 2,
                  paddingVertical: spacing.xs + 2,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.surfaceSecondary,
                  gap: 4,
                },
                selectedSort === option.value && {
                  backgroundColor: colors.primary + '15',
                },
              ]}
              onPress={() => onSortChange(option.value)}
            >
              <Ionicons
                name={option.icon as any}
                size={14}
                color={
                  selectedSort === option.value
                    ? colors.primary
                    : colors.text.tertiary
                }
              />
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.tertiary },
                  selectedSort === option.value && {
                    color: colors.primary,
                    fontFamily: fontFamily.semibold,
                  },
                ]}
              >
                {t(`mobile.search.sort.${option.labelKey}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results Count */}
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <Text
          style={[typography.bodySmall, { color: colors.text.secondary }]}
        >
          {t('mobile.search.adsFound', { count: totalResults })}
        </Text>
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const params = useLocalSearchParams<{ industry?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<
    IndustryType | undefined
  >(params.industry as IndustryType | undefined);
  const [selectedSort, setSelectedSort] = useState<SortOption>('trending');

  // Debounce search query to reduce API thrashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filters: AdFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      industry: selectedIndustry,
      sort: selectedSort,
    }),
    [debouncedSearch, selectedIndustry, selectedSort]
  );

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteAds(filters);

  const handleIndustryPress = useCallback(
    (id: IndustryType) => {
      setSelectedIndustry(selectedIndustry === id ? undefined : id);
    },
    [selectedIndustry]
  );

  const renderHeader = useCallback(
    () => (
      <SearchListHeader
        colors={colors}
        selectedIndustry={selectedIndustry}
        selectedSort={selectedSort}
        totalResults={data?.pages[0]?.total || 0}
        onIndustryPress={handleIndustryPress}
        onSortChange={setSelectedSort}
      />
    ),
    [colors, selectedIndustry, selectedSort, data?.pages[0]?.total, handleIndustryPress]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      {/* Search Header */}
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <Text
          style={[
            typography.headingLarge,
            { color: colors.text.primary, marginBottom: spacing.sm },
          ]}
        >
          {t('mobile.search.title')}
        </Text>
        <Input
          placeholder={t('mobile.search.placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon="search"
          rightIcon={searchQuery ? 'close-circle' : undefined}
          onRightIconPress={() => setSearchQuery('')}
          style={{ marginBottom: 0 }}
        />
      </View>

      {isLoading ? (
        <LoadingScreen message={t('mobile.search.searching')} />
      ) : (
        <FlatList
          data={data?.pages.flatMap((page) => page.data) || []}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: spacing.md }}>
              <AdCard ad={item} />
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={t('mobile.search.noAdsFound')}
              message={t('mobile.search.noAdsMessage')}
              actionLabel={t('mobile.search.clearFilters')}
              onAction={() => {
                setSearchQuery('');
                setSelectedIndustry(undefined);
                setSelectedSort('trending');
              }}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View
                style={{
                  paddingVertical: spacing.lg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.text.secondary, marginBottom: spacing.sm },
                  ]}
                >
                  {t('mobile.search.loadingMore')}
                </Text>
              </View>
            ) : null
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
