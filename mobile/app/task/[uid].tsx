import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTask, useUpdateTask, useDeleteTask, useCreateTask } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useSubtasks } from '../../hooks/useSubtasks';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TagPicker } from '../../components/task/detail/TagPicker';
import { SubtaskList } from '../../components/task/detail/SubtaskList';
import { AttachmentList } from '../../components/task/detail/AttachmentList';
import { DatePicker } from '../../components/task/detail/DatePicker';
import { MarkdownEditor } from '../../components/task/detail/MarkdownEditor';
import { useToast } from '../../hooks/useToast';
import { TaskStatus, TaskPriority } from '../../shared/types/index';
import type { Task, Project, Tag } from '../../shared/types/index';
import { Colors } from '../../constants/theme';

const STATUSES = [
  { label: '待分配', value: TaskStatus.UNASSIGNED, color: Colors.status.unassigned, icon: 'circle-outline' },
  { label: '待办', value: TaskStatus.TODO, color: Colors.status.todo, icon: 'circle-half-full' },
  { label: '已完成', value: TaskStatus.COMPLETED, color: Colors.status.completed, icon: 'check-circle' },
  { label: '已放弃', value: TaskStatus.ABANDONED, color: Colors.status.abandoned, icon: 'close-circle' },
];
const PRIORITIES = [
  { label: '低', value: TaskPriority.LOW, color: Colors.priority.low },
  { label: '中', value: TaskPriority.MEDIUM, color: Colors.priority.medium },
  { label: '高', value: TaskPriority.HIGH, color: Colors.priority.high },
  { label: '紧急', value: TaskPriority.URGENT, color: Colors.priority.urgent },
];

export default function TaskDetailPage() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const params = useLocalSearchParams<{ uid: string; project_uid?: string }>();
  const isCreate = uid === 'create';
  const { data: task, isLoading } = useTask(isCreate ? '' : uid);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const { data: projectsData } = useProjects();
  const { showToast } = useToast();
  const projects: Project[] = (projectsData as Project[]) || [];
  const { data: subtasksData, refetch: refetchSubtasks } = useSubtasks(!isCreate && task ? uid : '');
  const subtasks = (subtasksData as Task[]) || [];

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [createProjectUid, setCreateProjectUid] = useState<string | null>(null);
  const [createPriority, setCreatePriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [createTagUids, setCreateTagUids] = useState<string[]>([]);
  const [createStartDate, setCreateStartDate] = useState<string | null>(null);
  const [createDueDate, setCreateDueDate] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setContent(task.content || '');
      // Mark initial load complete after state is set
      setTimeout(() => { initialLoadRef.current = false; }, 100);
    }
  }, [task]);

  useEffect(() => {
    if (!task || isCreate || initialLoadRef.current) return;
    if (title === task.title && content === (task.content || '')) {
      setSaveStatus('idle');
      return;
    }
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateTask.mutateAsync({ uid: task.uid, data: { title: title.trim(), content: content.trim() || undefined } });
        setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000);
      } catch { setSaveStatus('idle'); }
    }, 1000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [title, content]);

  const handleStatusChange = async (opt: any) => { if (!task) return; try { await updateTask.mutateAsync({ uid: task.uid, data: { status: opt.value } }); } catch {} };
  const handlePriorityChange = async (val: TaskPriority) => { if (isCreate) { setCreatePriority(val); return; } if (!task) return; try { await updateTask.mutateAsync({ uid: task.uid, data: { priority: val } }); } catch {} };
  const handleToggleComplete = async () => { if (!task || isCreate) return; try { await updateTask.mutateAsync({ uid: task.uid, data: { status: task.is_completed ? TaskStatus.TODO : TaskStatus.COMPLETED } }); } catch {} };
  const handleProjectChange = async (pUid: string | null) => { if (isCreate) { setCreateProjectUid(pUid); setShowProjectPicker(false); return; } if (!task) return; try { await updateTask.mutateAsync({ uid: task.uid, data: { project_uid: pUid || undefined } }); } catch {} setShowProjectPicker(false); };
  const handleToggleTag = async (tagUid: string) => {
    if (isCreate) {
      setCreateTagUids((prev) => prev.includes(tagUid) ? prev.filter((id) => id !== tagUid) : [...prev, tagUid]);
      return;
    }
    if (!task) return;
    const cur = task.tags.map((t: Tag) => t.uid);
    const next = cur.includes(tagUid) ? cur.filter((id: string) => id !== tagUid) : [...cur, tagUid];
    try { await updateTask.mutateAsync({ uid: task.uid, data: { tag_uids: next } }); } catch {}
  };
  const handleDelete = async () => { if (!task) return; try { await deleteTask.mutateAsync(task.uid); router.back(); } catch {} };
  const handleCreate = async () => {
    if (!title.trim()) { showToast('error', '请输入标题'); return; }
    try {
      const d: Record<string, any> = { title: title.trim(), priority: createPriority };
      if (content.trim()) d.content = content.trim();
      if (createProjectUid) d.project_uid = createProjectUid;
      if (createTagUids.length > 0) d.tag_uids = createTagUids;
      if (createStartDate) d.start_date = createStartDate;
      if (createDueDate) d.due_date = createDueDate;
      await createTask.mutateAsync(d); router.back();
    } catch { showToast('error', '创建失败'); }
  };

  const handleQuickTime = async (field: 'start_date' | 'due_date', action: 'today' | 'tomorrow' | 'clear') => {
    let nextValue: string | null = null;
    if (action === 'clear') {
      nextValue = null;
    } else {
      const date = new Date();
      if (action === 'tomorrow') {
        date.setDate(date.getDate() + 1);
      }
      date.setHours(action === 'today' ? 9 : 18, 0, 0, 0);
      nextValue = date.toISOString();
    }
    if (isCreate) {
      if (field === 'start_date') setCreateStartDate(nextValue);
      else setCreateDueDate(nextValue);
      return;
    }
    if (!task) return;
    try {
      await updateTask.mutateAsync({ uid: task.uid, data: { [field]: nextValue } });
    } catch {}
  };

  useEffect(() => {
    if (!isCreate) return;
    if (params.project_uid && !createProjectUid) setCreateProjectUid(params.project_uid);
  }, [isCreate, params.project_uid, createProjectUid]);

  if (isLoading && !isCreate) return <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const curPriority = isCreate ? createPriority : (task?.priority ?? TaskPriority.MEDIUM);
  const curProject = isCreate ? projects.find((p) => p.uid === createProjectUid) : task?.project;
  const selectedTagUids = isCreate ? createTagUids : (task?.tags?.map((t: Tag) => t.uid) || []);
  const startDateValue = isCreate ? createStartDate : (task?.start_date || null);
  const dueDateValue = isCreate ? createDueDate : (task?.due_date || null);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
      {/* Drag handle indicator */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 2 }}>
          <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: '#d1d5db' }} />
        </View>
      </SafeAreaView>

      {/* Header: back | centered project | activity + more */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={isCreate ? 'close' : 'chevron-down'} size={24} color={Colors.primary} />
        </TouchableOpacity>
        {/* Centered project selector */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setShowProjectPicker(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }} numberOfLines={1}>{curProject?.name || '收集箱'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        {isCreate ? (
          <TouchableOpacity onPress={handleCreate} style={{ paddingHorizontal: 14, paddingVertical: 5, backgroundColor: Colors.primary, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>创建</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push(`/task/activity?uid=${task?.uid}` as any)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="history" size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMoreMenu(true)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="dots-horizontal" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1 }}>
          <View style={{ flexShrink: 0 }}>
            {/* Title row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
              {!isCreate && (
                <TouchableOpacity onPress={handleToggleComplete} style={{ marginRight: 8, height: 22, justifyContent: 'center' }}>
                  <MaterialCommunityIcons name={task?.is_completed ? 'check-circle' : 'circle-outline'} size={20} color={task?.is_completed ? Colors.success : '#d1d5db'} />
                </TouchableOpacity>
              )}
              <TextInput
                style={{ flex: 1, fontSize: 17, fontWeight: '600', color: task?.is_completed ? '#9ca3af' : '#111418', lineHeight: 20, paddingTop: 0, paddingBottom: 0,
                  textDecorationLine: task?.is_completed ? 'line-through' : 'none', ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}) }}
                placeholder="任务标题" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} multiline autoFocus={isCreate}
                textAlignVertical="top" />
              {/* Save status — inline right of title */}
              {saveStatus !== 'idle' && (
                <Text style={{ fontSize: 11, color: saveStatus === 'saving' ? '#9ca3af' : Colors.success, marginLeft: 8, lineHeight: 22 }}>
                  {saveStatus === 'saving' ? '保存中...' : '已保存'}
                </Text>
              )}
            </View>

            {/* Properties — each on its own row */}
            <View style={{ paddingHorizontal: 16, gap: 10, paddingBottom: 10 }}>
              {/* Priority row */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: '#9ca3af', width: 64 }}>优先级</Text>
                <View style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  {PRIORITIES.map((p) => {
                    const active = curPriority === p.value;
                    return (
                      <TouchableOpacity key={p.value} onPress={() => handlePriorityChange(p.value)}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: active ? p.color + '18' : '#f9fafb' }}>
                        <Text style={{ fontSize: 14, fontWeight: active ? '600' : '400', color: active ? p.color : '#c4c4c4' }}>{p.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {/* Tags row */}
              <TouchableOpacity onPress={() => setShowTagPicker(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: '#9ca3af', width: 64 }}>标签</Text>
                {!isCreate && task && task.tags.length > 0 ? (
                  <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    {task.tags.map((t: Tag) => (
                      <View key={t.uid} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.color + '18', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.color }} />
                        <Text style={{ fontSize: 12, color: t.color, fontWeight: '500' }}>{t.name}</Text>
                      </View>
                    ))}
                  </View>
                ) : isCreate && createTagUids.length > 0 ? (
                  <View style={{ flex: 1, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>已选择 {createTagUids.length} 个标签</Text>
                  </View>
                ) : (
                  <View style={{ flex: 1, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 14, color: '#d1d5db' }}>点击添加</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Date rows */}
              {(isCreate || (!!task && !isCreate)) && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15, color: '#9ca3af', width: 64 }}>开始</Text>
                    <DatePicker label="开始" value={startDateValue} compact
                      onChange={(v) => {
                        if (isCreate) { setCreateStartDate(v); return; }
                        if (!task) return;
                        updateTask.mutateAsync({ uid: task.uid, data: { start_date: v || undefined } }).catch(() => {});
                      }} />
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity onPress={() => handleQuickTime('start_date', 'today')} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#dbeafe' }}>
                        <Text style={{ fontSize: 13, color: '#2563eb' }}>今天</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleQuickTime('start_date', 'clear')} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#f3f4f6' }}>
                        <Text style={{ fontSize: 13, color: '#6b7280' }}>清空</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15, color: '#9ca3af', width: 64 }}>截止</Text>
                    <DatePicker label="截止" value={dueDateValue} isOverdue={!!task?.is_overdue} compact
                      onChange={(v) => {
                        if (isCreate) { setCreateDueDate(v); return; }
                        if (!task) return;
                        updateTask.mutateAsync({ uid: task.uid, data: { due_date: v || undefined } }).catch(() => {});
                      }} />
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity onPress={() => handleQuickTime('due_date', 'today')} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#dbeafe' }}>
                        <Text style={{ fontSize: 13, color: '#2563eb' }}>今天</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleQuickTime('due_date', 'tomorrow')} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#dcfce7' }}>
                        <Text style={{ fontSize: 13, color: '#16a34a' }}>明天</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleQuickTime('due_date', 'clear')} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#f3f4f6' }}>
                        <Text style={{ fontSize: 13, color: '#6b7280' }}>清空</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Subtasks (compact when empty) */}
            {!isCreate && task && <SubtaskList parentTask={task} subtasks={subtasks} onRefresh={() => refetchSubtasks()} />}

            {/* Attachments — only show section if has attachments */}
            {!isCreate && task && task.attachments && task.attachments.length > 0 && (
              <AttachmentList attachments={task.attachments} onContentInsert={(t) => setContent((p) => p + t)} />
            )}

            {task?.parent && (
              <TouchableOpacity onPress={() => router.push(`/task/${task.parent}`)} style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, color: Colors.primary }}>查看父任务 →</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ===== Content editor — fills ALL remaining space ===== */}
          <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="输入任务内容... (支持 Markdown)"
              autoFocus={!isCreate}
              footerText={!isCreate && task ? (
                (task.completed_time ? `完成于 ${new Date(task.completed_time).toLocaleString('zh-CN')} · ` : '') +
                `创建于 ${new Date(task.created_at).toLocaleString('zh-CN')}`
              ) : undefined}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sheets */}
      <ActionSheet visible={showStatusSheet} title="选择状态"
        options={STATUSES.map((s) => ({ ...s, value: String(s.value) }))}
        onSelect={(o) => handleStatusChange({ ...o, value: parseInt(o.value as string) })}
        onCancel={() => setShowStatusSheet(false)} />
      <ActionSheet visible={showProjectPicker} title="选择项目"
        options={[{ label: '收集箱', value: '__none__', icon: '📥' }, ...projects.map((p: Project) => ({ label: p.name, value: p.uid, icon: '📁' }))]}
        onSelect={(o) => handleProjectChange(o.value === '__none__' ? null : o.value as string)}
        onCancel={() => setShowProjectPicker(false)} />
      <ActionSheet visible={showMoreMenu} title="更多操作" options={[
        ...(task?.status !== TaskStatus.ABANDONED ? [{ label: '放弃任务', value: 'abandon', icon: '🚫' }] : [{ label: '恢复任务', value: 'restore', icon: '↩️' }]),
        { label: '删除任务', value: 'delete', icon: '🗑', color: '#ef4444', destructive: true },
      ]} onSelect={(o) => {
        if (o.value === 'delete') setShowDeleteConfirm(true);
        else if (o.value === 'abandon' && task) updateTask.mutateAsync({ uid: task.uid, data: { status: TaskStatus.ABANDONED } });
        else if (o.value === 'restore' && task) updateTask.mutateAsync({ uid: task.uid, data: { status: TaskStatus.TODO } });
      }} onCancel={() => setShowMoreMenu(false)} />
      <TagPicker visible={showTagPicker} selectedTagUids={selectedTagUids} onToggleTag={handleToggleTag} onClose={() => setShowTagPicker(false)} />
      <ConfirmDialog visible={showDeleteConfirm} title="删除任务"
        message={task?.subtasks_count ? `包含 ${task.subtasks_count} 个子任务，删除后无法恢复` : '确认删除？'}
        confirmText="删除" destructive onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
    </View>
  );
}

// No extra components needed
