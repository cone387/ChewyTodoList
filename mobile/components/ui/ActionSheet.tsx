import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ScrollView,
} from 'react-native';

export interface ActionSheetOption {
  label: string;
  value: string | number;
  color?: string;
  icon?: string;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onSelect: (option: ActionSheetOption) => void;
  onCancel: () => void;
  cancelLabel?: string;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  title,
  options,
  onSelect,
  onCancel,
  cancelLabel = '取消',
}) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 bg-black/40 justify-end">
          <TouchableWithoutFeedback>
            <Animated.View
              style={{ transform: [{ translateY: slideAnim }] }}
              className="bg-white rounded-t-2xl pb-8"
            >
              {title && (
                <View className="px-4 py-3 border-b border-gray-100">
                  <Text className="text-center text-sm text-gray-500 font-medium">{title}</Text>
                </View>
              )}
              <ScrollView>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={`${option.value}-${index}`}
                    className="px-4 py-4 border-b border-gray-50 flex-row items-center"
                    onPress={() => {
                      onSelect(option);
                      onCancel();
                    }}
                  >
                    {option.icon && (
                      <Text className="text-lg mr-3">{option.icon}</Text>
                    )}
                    <Text
                      className="text-base flex-1"
                      style={{ color: option.destructive ? '#ef4444' : option.color || '#111418' }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                className="mx-4 mt-3 py-3.5 bg-gray-100 rounded-xl items-center"
                onPress={onCancel}
              >
                <Text className="text-base font-medium text-gray-700">{cancelLabel}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
