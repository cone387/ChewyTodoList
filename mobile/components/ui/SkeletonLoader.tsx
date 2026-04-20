import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, Platform } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#e5e7eb',
          opacity,
        },
        style,
      ]}
    />
  );
};

/** Approximates a TaskCard skeleton */
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View
      style={[
        {
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: 12,
          marginHorizontal: 16,
          marginVertical: 4,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <SkeletonLoader width={14} height={14} borderRadius={2} />
        <SkeletonLoader width="60%" height={16} borderRadius={4} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SkeletonLoader width={48} height={12} borderRadius={4} />
        <SkeletonLoader width={64} height={12} borderRadius={4} />
      </View>
    </View>
  );
};

/** Approximates a list item skeleton (icon circle + two text bars) */
export const SkeletonListItem: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: '#fff',
          gap: 12,
        },
        style,
      ]}
    >
      <SkeletonLoader width={36} height={36} borderRadius={10} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonLoader width="70%" height={14} borderRadius={4} />
        <SkeletonLoader width="40%" height={10} borderRadius={4} />
      </View>
    </View>
  );
};
