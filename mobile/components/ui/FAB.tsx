import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';

interface FABProps {
  onPress: () => void;
  icon?: string;
  label?: string;
}

export const FAB: React.FC<FABProps> = ({ onPress, icon, label }) => {
  return (
    <View style={{ position: 'absolute', bottom: 24, right: 20 }}>
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
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        {label && (
          <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8, fontSize: 15 }}>{label}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
