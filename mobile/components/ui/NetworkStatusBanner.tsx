/**
 * 网络状态提示条 - 在网络断开或恢复时显示友好提示
 */
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const NetworkStatusBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-50))[0];

  useEffect(() => {
    // 网络状态变化时显示提示
    if (!isOnline) {
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // 网络恢复时自动隐藏
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isOnline]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
        isOnline ? styles.online : styles.offline,
      ]}
    >
      <MaterialCommunityIcons
        name={isOnline ? 'wifi' : 'wifi-off'}
        size={18}
        color="#ffffff"
      />
      <Text style={styles.text}>
        {isOnline ? '网络已恢复' : '网络已断开，部分功能可能受限'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  online: {
    backgroundColor: '#10b981',
  },
  offline: {
    backgroundColor: '#f59e0b',
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

/**
 * 离线模式包装组件 - 在离线时显示降级提示
 */
export const OfflineWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <NetworkStatusBanner />
      {children}
    </>
  );
};
