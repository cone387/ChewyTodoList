import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
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

export const SubtaskList: React.FC<SubtaskListProps> = ({ parentTask, subtasks, onRefresh }) => {
  const createTask = useCreateTask();
  const toggleStatus = useToggleTaskStatus();
  const deleteTask = useDeleteTask();
  const { showToast } = useToast();

  const [newTitle, setNewTitle] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const completed = subtasks.filter((t) => t.is_completed).length;
  const total = subtasks.length;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTask.mutateAsync({ title: newTitle.trim(), parent_uid: parentTask.uid, project_uid: parentTask.project?.uid });
      setNewTitle('');
      onRefresh?.();
      // Keep sheet open for adding more
    } catch { showToast('error', '添加失败'); }
  };

  const handleDelete = async () => {
    if (!selectedSubtask) return;
    try { await deleteTask.mutateAsync(selectedSubtask.uid); onRefresh?.(); } catch { showToast('error', '删除失败'); }
    setShowDeleteConfirm(false); setSelectedSubtask(null);
  };

  // Compact: no subtasks — just a single line button
  if (total === 0) {
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
        <TouchableOpacity onPress={() => { setShowAddSheet(true); setTimeout(() => inputRef.current?.focus(), 300); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="plus-circle-outline" size={16} color={Colors.primary} />
          <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '500' }}>添加子任务</Text>
        </TouchableOpacity>
        {renderAddSheet()}
      </View>
    );
  }

  function renderAddSheet() {
    return (
      <Modal visible={showAddSheet} transparent animationType="slide" onRequestClose={() => setShowAddSheet(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAddSheet(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <TouchableWithoutFeedback>
                <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 16 }}>
                  <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
                    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
                  </View>
                  <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111418', marginBottom: 12 }}>添加子任务</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TextInput
                        ref={inputRef}
                        style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111418' }}
                        placeholder="子任务标题..."
                        placeholderTextColor="#9ca3af"
                        value={newTitle}
                        onChangeText={setNewTitle}
                        returnKeyType="done"
                        onSubmitEditing={handleAdd}
                        autoFocus
                      />
                      <TouchableOpacity onPress={handleAdd}
                        style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 12 }}>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>添加</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  return (
    <View style={{ paddingVertical: 6 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>子任务</Text>
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>{completed}/{total}</Text>
        </View>
        <TouchableOpacity onPress={() => { setShowAddSheet(true); setTimeout(() => inputRef.current?.focus(), 300); }}>
          <MaterialCommunityIcons name="plus" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
        <ProgressBar value={total > 0 ? completed / total : 0} color={Colors.success} />
      </View>

      {/* Items */}
      {subtasks.map((st) => (
        <TouchableOpacity key={st.uid}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}
          onPress={() => router.push(`/task/${st.uid}`)}
          onLongPress={() => { setSelectedSubtask(st); setShowActions(true); }}>
          <TouchableOpacity onPress={() => toggleStatus.mutate({ task: st })} style={{ marginRight: 10 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name={st.is_completed ? 'check-circle' : 'circle-outline'} size={18} color={st.is_completed ? Colors.success : '#d1d5db'} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 14, color: st.is_completed ? '#9ca3af' : '#374151', textDecorationLine: st.is_completed ? 'line-through' : 'none' }} numberOfLines={1}>
            {st.title}
          </Text>
        </TouchableOpacity>
      ))}

      {renderAddSheet()}

      <ActionSheet visible={showActions} title={selectedSubtask?.title || ''} options={[
        { label: '查看详情', value: 'view', icon: '📄' },
        { label: '删除', value: 'delete', icon: '🗑', color: '#ef4444', destructive: true },
      ]} onSelect={(o) => {
        if (o.value === 'view' && selectedSubtask) router.push(`/task/${selectedSubtask.uid}`);
        else if (o.value === 'delete') setShowDeleteConfirm(true);
        setShowActions(false);
      }} onCancel={() => { setShowActions(false); setSelectedSubtask(null); }} />

      <ConfirmDialog visible={showDeleteConfirm} title="删除子任务" message={`确认删除「${selectedSubtask?.title}」？`}
        confirmText="删除" destructive onConfirm={handleDelete} onCancel={() => { setShowDeleteConfirm(false); setSelectedSubtask(null); }} />
    </View>
  );
};
