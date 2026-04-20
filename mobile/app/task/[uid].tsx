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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (task) { setTitle(task.title); setContent(task.content || ''); } }, [task]);

  useEffect(() => {
    if (!task || isCreate) return;
    if (title === task.title && content === (task.content || '')) return;
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
  const handleToggleTag = async (tagUid: string) => { if (!task || isCreate) return; const cur = task.tags.map((t: Tag) => t.uid); const next = cur.includes(tagUid) ? cur.filter((id: string) => id !== tagUid) : [...cur, tagUid]; try { await updateTask.mutateAsync({ uid: task.uid, data: { tag_uids: next } }); } catch {} };
  const handleDelete = async () => { if (!task) return; try { await deleteTask.mutateAsync(task.uid); router.back(); } catch {} };
  const handleCreate = async () => {
    if (!title.trim()) { showToast('error', '请输入标题'); return; }
    try {
      const d: Record<string, any> = { title: title.trim(), priority: createPriority };
      if (content.trim()) d.content = content.trim();
      if (createProjectUid) d.project_uid = createProjectUid;
      await createTask.mutateAsync(d); router.back();
    } catch { showToast('error', '创建失败'); }
  };

  if (isLoading && !isCreate) return <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;

  const curStatus = STATUSES.find((s) => s.value === task?.status) || STATUSES[1];
  const curPriority = isCreate ? createPriority : (task?.priority ?? TaskPriority.MEDIUM);
  const curProject = isCreate ? projects.find((p) => p.uid === createProjectUid) : task?.project;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header: back | project dropdown | save status | activity + more */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={isCreate ? 'close' : 'arrow-left'} size={22} color={Colors.primary} />
        </TouchableOpacity>
        {/* Project selector in header */}
        <TouchableOpacity onPress={() => setShowProjectPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f3f4f6' }}>
          <MaterialCommunityIcons name="folder" size={14} color="#6b7280" />
          <Text style={{ fontSize: 13, color: '#374151', maxWidth: 120 }} numberOfLines={1}>{curProject?.name || '收集箱'}</Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color="#9ca3af" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          {saveStatus === 'saving' && <Text style={{ color: '#9ca3af', fontSize: 12 }}>保存中...</Text>}
          {saveStatus === 'saved' && <Text style={{ color: Colors.success, fontSize: 12 }}>已保存</Text>}
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
            {/* Title — checkbox vertically centered with first line of text */}
            <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, flexDirection: 'row', alignItems: 'flex-start' }}>
              {!isCreate && (
                <TouchableOpacity onPress={handleToggleComplete} style={{ marginRight: 8, marginTop: 2 }}>
                  <MaterialCommunityIcons name={task?.is_completed ? 'check-circle' : 'circle-outline'} size={20} color={task?.is_completed ? Colors.success : '#d1d5db'} />
                </TouchableOpacity>
              )}
              <TextInput
                style={{ flex: 1, fontSize: 17, fontWeight: '600', color: task?.is_completed ? '#9ca3af' : '#111418', lineHeight: 22, paddingVertical: 0,
                  textDecorationLine: task?.is_completed ? 'line-through' : 'none' }}
                placeholder="任务标题" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} multiline />
            </View>

            {/* Properties — single horizontal scrollable row: 优先级: 低 中 高 紧急 | 标签: xxx | 截止: xxx | 开始: xxx */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6, gap: 12, alignItems: 'center' }}>
              {/* Priority */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>优先级:</Text>
                {PRIORITIES.map((p) => {
                  const active = curPriority === p.value;
                  return (
                    <TouchableOpacity key={p.value} onPress={() => handlePriorityChange(p.value)}
                      style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: active ? p.color + '18' : 'transparent' }}>
                      <Text style={{ fontSize: 12, fontWeight: active ? '600' : '400', color: active ? p.color : '#c4c4c4' }}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* Tags */}
              {!isCreate && task && (
                <TouchableOpacity onPress={() => setShowTagPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>标签:</Text>
                  <Text style={{ fontSize: 12, color: task.tags.length > 0 ? '#374151' : '#c4c4c4' }}>
                    {task.tags.length > 0 ? task.tags.map((t: Tag) => t.name).join(', ') : '无'}
                  </Text>
                </TouchableOpacity>
              )}
              {/* Dates */}
              {!isCreate && task && (
                <>
                  <DatePicker label="截止" value={task.due_date} isOverdue={task.is_overdue} compact
                    onChange={(v) => { updateTask.mutateAsync({ uid: task.uid, data: { due_date: v || undefined } }).catch(() => {}); }} />
                  <DatePicker label="开始" value={task.start_date} compact
                    onChange={(v) => { updateTask.mutateAsync({ uid: task.uid, data: { start_date: v || undefined } }).catch(() => {}); }} />
                </>
              )}
            </ScrollView>

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
      {!isCreate && task && <TagPicker visible={showTagPicker} selectedTagUids={task.tags.map((t: Tag) => t.uid)} onToggleTag={handleToggleTag} onClose={() => setShowTagPicker(false)} />}
      <ConfirmDialog visible={showDeleteConfirm} title="删除任务"
        message={task?.subtasks_count ? `包含 ${task.subtasks_count} 个子任务，删除后无法恢复` : '确认删除？'}
        confirmText="删除" destructive onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
    </SafeAreaView>
  );
}

// No extra components needed
