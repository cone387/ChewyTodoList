import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface OfflineBannerProps {
  visible: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ visible }) => {
  if (!visible) return null;
  return (
    <View style={{ backgroundColor: '#f59e0b', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <MaterialCommunityIcons name="wifi-off" size={14} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>离线模式 — 显示缓存数据</Text>
    </View>
  );
};
