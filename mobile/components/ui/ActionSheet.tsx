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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export interface ActionSheetOption {
  label: string;
  value: string | number;
  color?: string;
  /** Emoji or short-glyph icon (legacy). Prefer `mci` for consistent cross-platform rendering. */
  icon?: string;
  /** Material Community Icons name — when provided, overrides `icon`. */
  mci?: string;
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
  const { colors } = useTheme();
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
                backgroundColor: colors.card,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 34,
              }}
            >
              {/* Handle bar */}
              <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.text.muted }} />
              </View>

              {title && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
                  <Text style={{ textAlign: 'center', fontSize: 14, color: colors.text.secondary, fontWeight: '500' }}>{title}</Text>
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
                    {option.mci ? (
                      <MaterialCommunityIcons
                        name={option.mci as any}
                        size={20}
                        color={option.destructive ? colors.error : option.color || colors.text.secondary}
                        style={{ marginRight: 12, width: 20, textAlign: 'center' }}
                      />
                    ) : option.icon ? (
                      <Text style={{ fontSize: 18, marginRight: 12, width: 20, textAlign: 'center' }}>{option.icon}</Text>
                    ) : null}
                    <Text
                      style={{
                        fontSize: 16,
                        flex: 1,
                        color: option.destructive ? colors.error : option.color || colors.text.primary,
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
                  backgroundColor: colors.background.tertiary,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                onPress={onCancel}
              >
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text.secondary }}>{cancelLabel}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
