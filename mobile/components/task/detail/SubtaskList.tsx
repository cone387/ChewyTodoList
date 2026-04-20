import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback,
  KeyboardAvoidingView, Platform,
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

interface Props {
  parentTask: Task;
  subtasks: Task[];
  onRefresh?: () => void;
}

export const SubtaskList: React.FC<Props> = ({ parentTask, subtasks, onRefresh }) => {
  const createTask = useCreateTask();
  const toggleStatus = useToggleTaskStatus();
  const deleteTask = useDeleteTask();
  const { showToast } = useToast();

  const [newTitle, setNewTitle] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selTask, setSelTask] = useState<Task | null>(null);
  const [showAct, setShowAct] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const done = subtasks.filter((t) => t.is_completed).length;
  const total = subtasks.length;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTask.mutateAsync({ title: newTitle.trim(), parent_uid: parentTask.uid, project_uid: parentTask.project?.uid });
      setNewTitle('');
      onRefresh?.();
    } catch { showToast('error', '添加失败'); }
  };

  const handleDel = async () => {
    if (!selTask) return;
    try { await deleteTask.mutateAsync(selTask.uid); onRefresh?.(); } catch {}
    setShowDel(false); setSelTask(null);
  };

  const addSheet = (
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
                    <TextInput ref={inputRef}
                      style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111418' }}
                      placeholder="子任务标题..." placeholderTextColor="#9ca3af" value={newTitle} onChangeText={setNewTitle}
                      returnKeyType="done" onSubmitEditing={handleAdd} autoFocus />
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

  // No subtasks — just "添加子任务" link
  if (total === 0) {
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
        <TouchableOpacity onPress={() => setShowAddSheet(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="plus-circle-outline" size={16} color={Colors.primary} />
          <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '500' }}>添加子任务</Text>
        </TouchableOpacity>
        {addSheet}
      </View>
    );
  }

  // Has subtasks — collapsible
  return (
    <View style={{ paddingVertical: 4 }}>
      {/* Header — always visible, tap to expand/collapse */}
      <TouchableOpacity onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 }}>
        <MaterialCommunityIcons name={expanded ? 'chevron-down' : 'chevron-right'} size={18} color="#9ca3af" />
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginLeft: 4 }}>子任务</Text>
        <Text style={{ fontSize: 12, color: '#9ca3af', marginLeft: 6 }}>{done}/{total}</Text>
        <View style={{ flex: 1, marginLeft: 10, marginRight: 8 }}>
          <ProgressBar value={total > 0 ? done / total : 0} color={Colors.success} />
        </View>
        <TouchableOpacity onPress={() => setShowAddSheet(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="plus" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Expanded list */}
      {expanded && subtasks.map((st) => (
        <TouchableOpacity key={st.uid}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingLeft: 36, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}
          onPress={() => router.push(`/task/${st.uid}`)}
          onLongPress={() => { setSelTask(st); setShowAct(true); }}>
          <TouchableOpacity onPress={() => toggleStatus.mutate({ task: st })} style={{ marginRight: 8 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name={st.is_completed ? 'check-circle' : 'circle-outline'} size={16} color={st.is_completed ? Colors.success : '#d1d5db'} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 13, color: st.is_completed ? '#9ca3af' : '#374151', textDecorationLine: st.is_completed ? 'line-through' : 'none' }} numberOfLines={1}>
            {st.title}
          </Text>
        </TouchableOpacity>
      ))}

      {addSheet}

      <ActionSheet visible={showAct} title={selTask?.title || ''} options={[
        { label: '查看详情', value: 'view', icon: '📄' },
        { label: '删除', value: 'del', icon: '🗑', color: '#ef4444', destructive: true },
      ]} onSelect={(o) => {
        if (o.value === 'view' && selTask) router.push(`/task/${selTask.uid}`);
        else if (o.value === 'del') setShowDel(true);
        setShowAct(false);
      }} onCancel={() => { setShowAct(false); setSelTask(null); }} />

      <ConfirmDialog visible={showDel} title="删除子任务" message={`确认删除「${selTask?.title}」？`}
        confirmText="删除" destructive onConfirm={handleDel} onCancel={() => { setShowDel(false); setSelTask(null); }} />
    </View>
  );
};
