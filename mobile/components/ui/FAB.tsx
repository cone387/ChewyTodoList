import React from 'react';
import { TouchableOpacity, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';

interface FABProps {
  onPress: () => void;
  icon?: string;
  label?: string;
  accessibilityLabel?: string;
}

// Tab bar height approximation (paddingTop:8 + icon:24 + mt:2 + text:~14 + paddingBottom varies)
const TAB_BAR_CONTENT_HEIGHT = 52;

export const FAB: React.FC<FABProps> = ({ onPress, icon, label, accessibilityLabel }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + (Platform.OS === 'ios' ? insets.bottom : 8);
  const bottom = tabBarHeight + 16;

  return (
    <View style={{ position: 'absolute', bottom, right: 20 }} pointerEvents="box-none">
      <TouchableOpacity
        style={{
          backgroundColor: Colors.primary,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          width: label ? undefined : 56,
          height: 56,
          paddingHorizontal: label ? 20 : 0,
          ...Shadows.primaryMedium,
        }}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label || '创建任务'}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        {label && (
          <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8, fontSize: 15 }}>{label}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
