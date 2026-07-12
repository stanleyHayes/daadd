import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius } from '@/theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
        padded && { padding: spacing.md },
        style,
      ]}
    >
      {children}
    </View>
  );
}
