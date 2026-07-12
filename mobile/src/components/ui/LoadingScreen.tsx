import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const colors = useColors();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text
          style={[
            typography.bodyMedium,
            { color: colors.text.secondary, marginTop: spacing.md },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
