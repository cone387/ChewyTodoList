import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ScrollView,
  Platform,
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
        useNativeDriver: Platform.OS !== 'web',
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={{
                transform: [{ translateY: slideAnim }],
                backgroundColor: '#fff',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 34,
              }}
            >
              {/* Handle bar */}
              <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
              </View>

              {title && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                  <Text style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', fontWeight: '500' }}>{title}</Text>
                </View>
              )}
              <ScrollView style={{ maxHeight: 300 }}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={`${option.value}-${index}`}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: '#f9fafb',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      onSelect(option);
                      onCancel();
                    }}
                  >
                    {option.icon && (
                      <Text style={{ fontSize: 18, marginRight: 12 }}>{option.icon}</Text>
                    )}
                    <Text
                      style={{
                        fontSize: 16,
                        flex: 1,
                        color: option.destructive ? '#ef4444' : option.color || '#111418',
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={{
                  marginHorizontal: 16,
                  marginTop: 12,
                  paddingVertical: 14,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                onPress={onCancel}
              >
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#374151' }}>{cancelLabel}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
