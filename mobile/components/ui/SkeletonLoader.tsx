import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * 基础骨架屏加载组件 — 带呼吸动画
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.background.tertiary,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * 任务卡片骨架屏
 */
export const SkeletonCard: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <SkeletonLoader width={20} height={20} borderRadius={10} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <SkeletonLoader width="70%" height={16} />
        </View>
        <SkeletonLoader width={40} height={20} borderRadius={4} />
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
        <SkeletonLoader width={60} height={18} borderRadius={4} />
        <SkeletonLoader width={80} height={18} borderRadius={4} />
        <SkeletonLoader width={50} height={18} borderRadius={4} />
      </View>
    </View>
  );
};

/**
 * 列表项骨架屏
 */
export const SkeletonListItem: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}
    >
      <SkeletonLoader width={36} height={36} borderRadius={18} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <SkeletonLoader width="60%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonLoader width="40%" height={12} />
      </View>
      <SkeletonLoader width={24} height={24} borderRadius={12} />
    </View>
  );
};
