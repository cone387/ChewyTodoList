import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconSize?: number;
  iconColor?: string;
  message: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconSize = 48,
  iconColor = '#d1d5db',
  message,
  description,
  action,
}) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 }}>
      <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />
      <Text style={{ fontSize: 16, color: '#9ca3af', marginTop: 12, textAlign: 'center' }}>
        {message}
      </Text>
      {description ? (
        <Text style={{ fontSize: 13, color: '#d1d5db', marginTop: 4, textAlign: 'center' }}>
          {description}
        </Text>
      ) : null}
      {action ? (
        <TouchableOpacity
          onPress={action.onPress}
          style={{
            marginTop: 16,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: Colors.primary,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
