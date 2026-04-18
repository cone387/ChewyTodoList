import React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  value: number; // 0-1
  color?: string;
  height?: number;
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = '#8b5cf6',
  height = 4,
  backgroundColor = '#e5e7eb',
}) => {
  const clampedValue = Math.min(1, Math.max(0, value));
  return (
    <View style={{ height, backgroundColor, borderRadius: height / 2, overflow: 'hidden' }}>
      <View
        style={{
          height,
          width: `${clampedValue * 100}%`,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
};
