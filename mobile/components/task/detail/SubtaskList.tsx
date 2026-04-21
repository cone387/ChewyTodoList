import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useCreateTask, useToggleTaskStatus, useDeleteTask, useUpdateTask } from '../../../hooks/useTasks';
import { ProgressBar } from '../../ui/ProgressBar';
import { ActionSheet } from '../../ui/ActionSheet';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { DatePicker } from './DatePicker';
import { useToast } from '../../../hooks/useToast';
import { Colors } from '../../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TaskPriority } from '../../../shared/types/index';
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
  const updateTask = useUpdateTask();
  const { showToast } = useToast();

  const [newTitle, setNewTitle] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [selTask, setSelTask] = useState<Task | null>(null);
  const [showAct, setShowAct] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [quickStartDate, setQuickStartDate] = useState<string | null>(null);
  const [quickDueDate, setQuickDueDate] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const done = subtasks.filter((t) => t.is_completed).length;
  const total = subtasks.length;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTask.mutateAsync({ title: newTitle.trim(), parent_uid: parentTask.uid, project_uid: parentTask.project?.uid });
      setNewTitle('');
      setExpanded(true);
      setShowAddSheet(false);
      onRefresh?.();
    } catch { showToast('error', '添加失败'); }
  };

  const handleDel = async () => {
    if (!selTask) return;
    try { await deleteTask.mutateAsync(selTask.uid); onRefresh?.(); } catch {}
    setShowDel(false); setSelTask(null);
  };

  const openQuickEdit = (task: Task) => {
    setSelTask(task);
    setQuickTitle(task.title || '');
    setQuickPriority((task.priority as TaskPriority) ?? TaskPriority.MEDIUM);
    setQuickStartDate(task.start_date || null);
    setQuickDueDate(task.due_date || null);
    setShowQuickEdit(true);
  };

  const handleQuickSave = async () => {
    if (!selTask || !quickTitle.trim()) return;
    try {
      await updateTask.mutateAsync({
        uid: selTask.uid,
        data: {
          title: quickTitle.trim(),
          priority: quickPriority,
          start_date: quickStartDate,
          due_date: quickDueDate,
        },
      });
      setShowQuickEdit(false);
      setSelTask(null);
      onRefresh?.();
    } catch {
      showToast('error', '保存失败');
    }
  };

  const addSheet = (
    <Modal visible={showAddSheet} transparent animationType="fade" onRequestClose={() => setShowAddSheet(false)}>
      <TouchableWithoutFeedback onPress={() => setShowAddSheet(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' }}>
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
          onPress={() => openQuickEdit(st)}
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
        { label: '快速编辑', value: 'edit', icon: '✏️' },
        { label: '删除', value: 'del', icon: '🗑', color: '#ef4444', destructive: true },
      ]} onSelect={(o) => {
        if (o.value === 'view' && selTask) router.push(`/task/${selTask.uid}`);
        else if (o.value === 'edit' && selTask) openQuickEdit(selTask);
        else if (o.value === 'del') setShowDel(true);
        setShowAct(false);
      }} onCancel={() => { setShowAct(false); setSelTask(null); }} />

      <ConfirmDialog visible={showDel} title="删除子任务" message={`确认删除「${selTask?.title}」？`}
        confirmText="删除" destructive onConfirm={handleDel} onCancel={() => { setShowDel(false); setSelTask(null); }} />

      <Modal visible={showQuickEdit} transparent animationType="fade" onRequestClose={() => setShowQuickEdit(false)}>
        <TouchableWithoutFeedback onPress={() => setShowQuickEdit(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, gap: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111418' }}>快速编辑子任务</Text>
                <TextInput
                  value={quickTitle}
                  onChangeText={setQuickTitle}
                  placeholder="子任务标题"
                  placeholderTextColor="#9ca3af"
                  style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111418' }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ width: 56, fontSize: 13, color: '#9ca3af' }}>优先级</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {[TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT].map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setQuickPriority(p)}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: quickPriority === p ? Colors.primary + '20' : '#f3f4f6' }}
                      >
                        <Text style={{ fontSize: 12, color: quickPriority === p ? Colors.primary : '#6b7280' }}>
                          {p === TaskPriority.LOW ? '低' : p === TaskPriority.MEDIUM ? '中' : p === TaskPriority.HIGH ? '高' : '紧急'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ width: 56, fontSize: 13, color: '#9ca3af' }}>开始</Text>
                  <DatePicker label="开始" value={quickStartDate} compact onChange={setQuickStartDate} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ width: 56, fontSize: 13, color: '#9ca3af' }}>截止</Text>
                  <DatePicker label="截止" value={quickDueDate} compact onChange={setQuickDueDate} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                  <TouchableOpacity onPress={() => setShowQuickEdit(false)} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleQuickSave} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.primary }}>
                    <Text style={{ fontSize: 14, color: '#fff', fontWeight: '600' }}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};
