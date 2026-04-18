import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useCreateTask, useToggleTaskStatus, useDeleteTask } from '../../../hooks/useTasks';
import { ProgressBar } from '../../ui/ProgressBar';
import { ActionSheet } from '../../ui/ActionSheet';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { useToast } from '../../../hooks/useToast';
import { Colors } from '../../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Task } from '../../../shared/types/index';

interface SubtaskListProps {
  parentTask: Task;
  subtasks: Task[];
  onRefresh?: () => void;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
  parentTask,
  subtasks,
  onRefresh,
}) => {
  const createTask = useCreateTask();
  const toggleStatus = useToggleTaskStatus();
  const deleteTask = useDeleteTask();
  const { showToast } = useToast();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const completedCount = subtasks.filter((t) => t.is_completed).length;
  const totalCount = subtasks.length;

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      await createTask.mutateAsync({
        title: newSubtaskTitle.trim(),
        parent_uid: parentTask.uid,
        project_uid: parentTask.project?.uid,
      });
      setNewSubtaskTitle('');
      showToast('success', '子任务已添加');
      onRefresh?.();
    } catch {
      showToast('error', '添加失败');
    }
  };

  const handleToggle = (task: Task) => {
    toggleStatus.mutate({ task });
  };

  const handleDelete = async () => {
    if (!selectedSubtask) return;
    try {
      await deleteTask.mutateAsync(selectedSubtask.uid);
      showToast('success', '子任务已删除');
      onRefresh?.();
    } catch {
      showToast('error', '删除失败');
    }
    setShowDeleteConfirm(false);
    setSelectedSubtask(null);
  };

  return (
    <View style={{ backgroundColor: '#fff', marginTop: 8, paddingVertical: 14 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>子任务</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>{completedCount}/{totalCount} 已完成</Text>
          <TouchableOpacity onPress={() => { setShowAddInput(true); setTimeout(() => inputRef.current?.focus(), 100); }}>
            <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>+ 添加</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      {totalCount > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <ProgressBar value={totalCount > 0 ? completedCount / totalCount : 0} color={Colors.success} />
        </View>
      )}

      {/* Subtask items */}
      {subtasks.map((subtask) => (
        <TouchableOpacity
          key={subtask.uid}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#f9fafb',
          }}
          onPress={() => router.push(`/task/${subtask.uid}`)}
          onLongPress={() => { setSelectedSubtask(subtask); setShowActions(true); }}
        >
          <TouchableOpacity
            onPress={() => handleToggle(subtask)}
            style={{ marginRight: 10 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 18, color: subtask.is_completed ? Colors.success : '#d1d5db' }}>
              {subtask.is_completed ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              color: subtask.is_completed ? '#9ca3af' : '#374151',
              textDecorationLine: subtask.is_completed ? 'line-through' : 'none',
            }}
            numberOfLines={1}
          >
            {subtask.title}
          </Text>
          {subtask.priority > 1 && (
            <Text style={{ fontSize: 10, color: Colors.priority[subtask.priority === 3 ? 'urgent' : subtask.priority === 2 ? 'high' : 'medium'] }}>
              ⚑
            </Text>
          )}
        </TouchableOpacity>
      ))}

      {/* Add subtask input */}
      {showAddInput && (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          <TextInput
            ref={inputRef}
            style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111418' }}
            placeholder="子任务标题..."
            placeholderTextColor="#9ca3af"
            value={newSubtaskTitle}
            onChangeText={setNewSubtaskTitle}
            returnKeyType="done"
            onSubmitEditing={handleAddSubtask}
            onBlur={() => { if (!newSubtaskTitle.trim()) setShowAddInput(false); }}
          />
          <TouchableOpacity onPress={handleAddSubtask}>
            <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '600' }}>添加</Text>
          </TouchableOpacity>
        </View>
      )}

      {totalCount === 0 && !showAddInput && (
        <TouchableOpacity
          style={{ alignItems: 'center', paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', gap: 4 }}
          onPress={() => { setShowAddInput(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={16} color={Colors.primary} />
          <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '500' }}>添加子任务</Text>
        </TouchableOpacity>
      )}

      {/* Subtask actions */}
      <ActionSheet
        visible={showActions}
        title={selectedSubtask?.title || ''}
        options={[
          { label: '查看详情', value: 'view', icon: '📄' },
          { label: '删除子任务', value: 'delete', icon: '🗑', color: '#ef4444', destructive: true },
        ]}
        onSelect={(opt) => {
          if (opt.value === 'view' && selectedSubtask) {
            router.push(`/task/${selectedSubtask.uid}`);
          } else if (opt.value === 'delete') {
            setShowDeleteConfirm(true);
          }
          setShowActions(false);
        }}
        onCancel={() => { setShowActions(false); setSelectedSubtask(null); }}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="删除子任务"
        message={`确认删除子任务「${selectedSubtask?.title}」？`}
        confirmText="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => { setShowDeleteConfirm(false); setSelectedSubtask(null); }}
      />
    </View>
  );
};
