import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface FABProps {
  onPress: () => void;
  icon?: string;
  label?: string;
}

export const FAB: React.FC<FABProps> = ({ onPress, icon = '+', label }) => {
  return (
    <View className="absolute bottom-6 right-5">
      <TouchableOpacity
        className="bg-purple-500 rounded-full shadow-lg items-center justify-center flex-row"
        style={{
          width: label ? undefined : 56,
          height: 56,
          paddingHorizontal: label ? 20 : 0,
          shadowColor: '#8b5cf6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text className="text-white text-2xl font-light">{icon}</Text>
        {label && <Text className="text-white font-semibold ml-2">{label}</Text>}
      </TouchableOpacity>
    </View>
  );
};
