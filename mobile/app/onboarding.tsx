/**
 * Onboarding 引导页 — 仅首次安装时展示
 * 3 页滑动引导 + 最后「开始使用」进入主界面
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    icon: 'check-circle-outline' as const,
    color: '#8b5cf6',
    title: '轻松管理待办',
    desc: '创建任务、设置优先级、安排截止时间\n用最简洁的方式掌控每一天',
  },
  {
    icon: 'repeat' as const,
    color: '#3b82f6',
    title: '重复任务自动化',
    desc: '日报、周会、健身计划...\n设置一次，自动生成，不再遗漏',
  },
  {
    icon: 'bell-ring-outline' as const,
    color: '#f59e0b',
    title: '准时提醒',
    desc: '本地通知精准推送\n重要事项绝不错过',
  },
];

export default function OnboardingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(auth)/login');
  };

  const renderPage = ({ item, index }: { item: typeof PAGES[0]; index: number }) => (
    <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
      <View style={{
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: item.color + '18',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 40,
      }}>
        <MaterialCommunityIcons name={item.icon} size={56} color={item.color} />
      </View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: '#1e1b4b', textAlign: 'center', marginBottom: 16 }}>
        {item.title}
      </Text>
      <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 }}>
        {item.desc}
      </Text>
    </View>
  );

  const isLastPage = currentIndex === PAGES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Skip button */}
      {!isLastPage && (
        <TouchableOpacity
          onPress={handleSkip}
          style={{ position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 24, zIndex: 10, padding: 8 }}
        >
          <Text style={{ fontSize: 15, color: '#9ca3af' }}>跳过</Text>
        </TouchableOpacity>
      )}

      {/* Pages */}
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        style={{ flex: 1 }}
      />

      {/* Bottom area: dots + button */}
      <View style={{ paddingBottom: Platform.OS === 'ios' ? 50 : 32, paddingHorizontal: 24, alignItems: 'center' }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
          {PAGES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={{
                  width: dotWidth,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.primary,
                  opacity,
                }}
              />
            );
          })}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={{
            width: '100%',
            backgroundColor: Colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            ...Platform.select({
              default: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              },
            }),
          }}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
            {isLastPage ? '开始使用' : '下一步'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
