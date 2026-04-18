import React from 'react';
import { View, Text } from 'react-native';

interface OfflineBannerProps {
  visible: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ visible }) => {
  if (!visible) return null;
  return (
    <View className="bg-yellow-500 px-4 py-2 flex-row items-center justify-center">
      <Text className="text-white text-xs font-medium">📡 离线模式 — 显示缓存数据</Text>
    </View>
  );
};
