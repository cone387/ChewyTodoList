import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-2xl w-full overflow-hidden">
              <View className="px-5 pt-5 pb-4">
                <Text className="text-lg font-semibold text-gray-900 text-center">{title}</Text>
                {message && (
                  <Text className="text-sm text-gray-500 text-center mt-2 leading-5">{message}</Text>
                )}
              </View>
              <View className="border-t border-gray-100 flex-row">
                <TouchableOpacity
                  className="flex-1 py-3.5 items-center border-r border-gray-100"
                  onPress={onCancel}
                >
                  <Text className="text-base text-gray-600">{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-3.5 items-center"
                  onPress={() => { onConfirm(); onCancel(); }}
                >
                  <Text
                    className="text-base font-semibold"
                    style={{ color: destructive ? '#ef4444' : '#8b5cf6' }}
                  >
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
