import React, { useCallback } from 'react';
import { FlatList, FlatListProps, ViewStyle } from 'react-native';
import { FadeIn } from './FadeIn';

interface AnimatedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactElement;
  staggerDelay?: number;
  itemStyle?: ViewStyle;
}

export function AnimatedList<T>({
  data,
  renderItem,
  staggerDelay = 80,
  itemStyle,
  ...rest
}: AnimatedListProps<T>) {
  const wrappedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <FadeIn delay={index * staggerDelay} style={itemStyle}>
        {renderItem({ item, index })}
      </FadeIn>
    ),
    [renderItem, staggerDelay, itemStyle]
  );

  return (
    <FlatList
      data={data}
      renderItem={wrappedRenderItem}
      {...rest}
    />
  );
}
