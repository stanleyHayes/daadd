import React from 'react';
import { Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography, fontFamily } from '@/theme/typography';
import { Pressable } from 'react-native';

interface CategoryChipProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CategoryChip({
  label,
  icon,
  color,
  selected = false,
  onPress,
  style,
}: CategoryChipProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 8, stiffness: 300 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.sm + 4,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: 'transparent',
            gap: spacing.xs,
            marginRight: spacing.sm,
            marginBottom: spacing.sm,
          },
          selected && { backgroundColor: color + '20', borderColor: color },
          animatedStyle,
          style,
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={selected ? color : colors.text.secondary}
        />
        <Text
          style={[
            typography.bodySmall,
            { color: colors.text.secondary },
            selected && { color, fontFamily: fontFamily.semibold },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
