/**
 * AnimatedCheckbox - 带完成动画的勾选框
 * 勾选时播放缩放 + 弹性动画
 */
import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface AnimatedCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onToggle,
  size = 20,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fillAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const prevChecked = useRef(checked);

  useEffect(() => {
    if (checked !== prevChecked.current) {
      prevChecked.current = checked;
      if (checked) {
        // Bounce + fill animation when completing
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 0.7, duration: 80, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
        ]).start();
        Animated.timing(fillAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
      } else {
        Animated.timing(fillAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
      }
    }
  }, [checked]);

  const bgColor = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', Colors.success],
  });

  const borderColor = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.text.muted, Colors.success],
  });

  return (
    <TouchableOpacity
      onPress={onToggle}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: scaleAnim }],
        }}
      >
        {checked && (
          <MaterialCommunityIcons name="check" size={size * 0.6} color="#fff" />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};
