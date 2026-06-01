import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTasks } from '../../../hooks/useTasks';
import { useTaskModal } from '../../../hooks/useTaskModal';
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';
import type { Task } from '../../../shared/types/index';

interface ParentTaskLinkProps {
  currentTaskUid: string;
  parentTaskUid?: string | null;
  onSetParent: (parentUid: string | null) => void;
}

export const ParentTaskLink: React.FC<ParentTaskLinkProps> = ({
  currentTaskUid,
  parentTaskUid,
  onSetParent,
}) => {
  const { colors } = useTheme();
  const { openTask } = useTaskModal();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch all tasks for parent selection (limit to 50)
  const { data: tasksData, isLoading } = useTasks({ limit: 50 });
  const tasks: Task[] = (tasksData as any)?.results || [];

  // Filter out current task and children of current task (to avoid circular)
  const availableTasks = tasks.filter(
    (t) => t.uid !== currentTaskUid && t.parent !== currentTaskUid
  );

  const filteredTasks = search
    ? availableTasks.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      )
    : availableTasks;

  const parentTask = tasks.find((t) => t.uid === parentTaskUid);

  const handleSelectParent = (taskUid: string) => {
    onSetParent(taskUid);
    setShowPicker(false);
    setSearch('');
  };

  const handleRemoveParent = () => {
    onSetParent(null);
  };

  const handleNavigateToParent = () => {
    if (parentTaskUid) {
      openTask(parentTaskUid);
    }
  };

  if (!parentTaskUid && !showPicker) {
    // Not set - show add button
    return (
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <MaterialCommunityIcons
          name="link-variant-plus"
          size={18}
          color={colors.text.muted}
          style={{ marginRight: 12 }}
        />
        <Text style={{ fontSize: 14, color: colors.text.muted }}>
          设置父任务
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      {/* Parent task link display */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <MaterialCommunityIcons
            name="link-variant"
            size={18}
            color={Colors.primary}
            style={{ marginRight: 12 }}
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.text.muted,
            }}
          >
            父任务
          </Text>
        </View>

        {parentTask ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={handleNavigateToParent}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.primary,
                  marginRight: 8,
                }}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: Colors.primary,
                  fontWeight: '500',
                }}
                numberOfLines={1}
              >
                {parentTask.title}
              </Text>
              <MaterialCommunityIcons
                name="open-in-new"
                size={16}
                color={Colors.primary}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRemoveParent}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.background.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons
                name="link-variant-off"
                size={16}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: colors.text.muted }}>
            加载中...
          </Text>
        )}
      </View>

      {/* Parent task picker modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'flex-end',
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: '70%',
                  paddingBottom: 34,
                }}
              >
                {/* Handle */}
                <View
                  style={{
                    alignItems: 'center',
                    paddingTop: 8,
                    paddingBottom: 4,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.text.muted,
                    }}
                  />
                </View>

                <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '600',
                      color: colors.text.primary,
                      marginBottom: 12,
                    }}
                  >
                    选择父任务
                  </Text>

                  {/* Search */}
                  <TextInput
                    style={{
                      backgroundColor: colors.background.tertiary,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 14,
                      color: colors.text.primary,
                      marginBottom: 12,
                    }}
                    placeholder="搜索任务..."
                    placeholderTextColor={colors.text.muted}
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>

                {isLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                  </View>
                ) : (
                  <FlatList
                    data={filteredTasks}
                    keyExtractor={(item) => item.uid}
                    style={{ paddingHorizontal: 16 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => handleSelectParent(item.uid)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.borderLight,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: item.is_completed
                              ? colors.success
                              : colors.text.muted,
                            marginRight: 12,
                          }}
                        />
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 15,
                            color: colors.text.secondary,
                          }}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        {item.parent && (
                          <MaterialCommunityIcons
                            name="link-variant"
                            size={14}
                            color={colors.text.muted}
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                        <Text style={{ color: colors.text.muted, fontSize: 14 }}>
                          {search ? '未找到匹配的任务' : '暂无可用任务'}
                        </Text>
                      </View>
                    }
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};
