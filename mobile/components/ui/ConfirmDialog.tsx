import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <TouchableWithoutFeedback>
            <View style={{ backgroundColor: colors.card, borderRadius: 20, width: '100%', overflow: 'hidden' }}>
              <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text.primary, textAlign: 'center' }}>{title}</Text>
                {message && (
                  <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>{message}</Text>
                )}
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight, flexDirection: 'row' }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#f3f4f6' }}
                  onPress={onCancel}
                >
                  <Text style={{ fontSize: 16, color: colors.text.secondary }}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}
                  onPress={() => { onConfirm(); onCancel(); }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: destructive ? '#ef4444' : Colors.primary }}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
