import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { borderRadius } from '@/theme/spacing';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const colors = useColors();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surfaceSecondary, colors.border]
    ),
  }));

  return (
    <Animated.View
      style={[
        { width: width as ViewStyle['width'], height, borderRadius: borderRadius.sm },
        animatedStyle,
        style,
      ]}
    />
  );
}
