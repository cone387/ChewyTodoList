import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * 标准化空状态组件
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
      {/* Icon */}
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.background.tertiary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <MaterialCommunityIcons name={icon} size={40} color={colors.text.muted} />
      </View>

      {/* Title */}
      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          color: colors.text.primary,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          style={{
            fontSize: 14,
            color: colors.text.muted,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: Colors.primary,
            borderRadius: 10,
            minWidth: 120,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
