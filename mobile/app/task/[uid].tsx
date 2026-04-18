import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTask, useUpdateTask, useDeleteTask, useCreateTask } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useSubtasks } from '../../hooks/useSubtasks';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { TagPicker } from '../../components/task/detail/TagPicker';
import { SubtaskList } from '../../components/task/detail/SubtaskList';
import { ActivityLog } from '../../components/task/detail/ActivityLog';
import { AttachmentList } from '../../components/task/detail/AttachmentList';
import { DatePicker } from '../../components/task/detail/DatePicker';
import { useToast } from '../../hooks/useToast';
import { TaskStatus, TaskPriority } from '../../shared/types/index';
import type { Task, Project, Tag } from '../../shared/types/index';
import { Colors } from '../../constants/theme';

const STATUS_OPTIONS = [
  { label: '待分配', value: TaskStatus.UNASSIGNED, color: Colors.status.unassigned, icon: '○' },
  { label: '待办', value: TaskStatus.TODO, color: Colors.status.todo, icon: '◎' },
  { label: '已完成', value: TaskStatus.COMPLETED, color: Colors.status.completed, icon: '✓' },
  { label: '已放弃', value: TaskStatus.ABANDONED, color: Colors.status.abandoned, icon: '✗' },
];

const PRIORITY_OPTIONS = [
  { label: '低', value: TaskPriority.LOW, color: Colors.priority.low },
  { label: '中', value: TaskPriority.MEDIUM, color: Colors.priority.medium },
  { label: '高', value: TaskPriority.HIGH, color: Colors.priority.high },
  { label: '紧急', value: TaskPriority.URGENT, color: Colors.priority.urgent },
];

function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === -1) return '昨天';
  if (diffDays > 1 && diffDays <= 7) return `${diffDays}天后`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function getQuickDates() {
  const today = new Date();
  today.setHours(18, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekend = new Date(today);
  weekend.setDate(weekend.getDate() + (6 - weekend.getDay()));
  weekend.setHours(18, 0, 0, 0);
  const nextMonday = new Date(today);
  nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);
  nextMonday.setHours(9, 0, 0, 0);
  return [
    { label: '今天', value: today.toISOString(), icon: '☀️' },
    { label: '明天', value: tomorrow.toISOString(), icon: '🌅' },
    { label: '本周末', value: weekend.toISOString(), icon: '🏖' },
    { label: '下周一', value: nextMonday.toISOString(), icon: '📅' },
  ];
}

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

  // Fetch subtasks for edit mode
  const { data: subtasksData, refetch: refetchSubtasks } = useSubtasks(!isCreate && task ? uid : '');
  const subtasks = (subtasksData as Task[]) || [];

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showPrioritySheet, setShowPrioritySheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Create mode state
  const [createProjectUid, setCreateProjectUid] = useState<string | null>(null);
  const [createPriority, setCreatePriority] = useState(TaskPriority.MEDIUM);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setContent(task.content || '');
    }
  }, [task]);

  // Auto-save for edit mode
  useEffect(() => {
    if (!task || isCreate) return;
    if (title === task.title && content === (task.content || '')) return;

    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateTask.mutateAsync({ uid: task.uid, data: { title: title.trim(), content: content.trim() || undefined } });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
        showToast('error', '保存失败');
      }
    }, 1000);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [title, content]);

  const handleStatusChange = async (option: any) => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({ uid: task.uid, data: { status: option.value } });
      showToast('success', `状态已更新为「${option.label}」`);
    } catch {
      showToast('error', '状态更新失败');
    }
  };

  const handlePriorityChange = async (option: any) => {
    if (isCreate) {
      setCreatePriority(option.value);
      return;
    }
    if (!task) return;
    try {
      await updateTask.mutateAsync({ uid: task.uid, data: { priority: option.value } });
    } catch {
      showToast('error', '优先级更新失败');
    }
  };

  const handleToggleComplete = async () => {
    if (!task || isCreate) return;
    const newStatus = task.is_completed ? TaskStatus.TODO : TaskStatus.COMPLETED;
    try {
      await updateTask.mutateAsync({ uid: task.uid, data: { status: newStatus } });
      showToast('success', task.is_completed ? '已取消完成' : '已标记完成');
    } catch {
      showToast('error', '操作失败');
    }
  };

  const handleProjectChange = async (projectUid: string | null) => {
    if (isCreate) {
      setCreateProjectUid(projectUid);
      setShowProjectPicker(false);
      return;
    }
    if (!task) return;
    try {
      await updateTask.mutateAsync({ uid: task.uid, data: { project_uid: projectUid || undefined } });
      showToast('success', '项目已更新');
    } catch {
      showToast('error', '项目更新失败');
    }
    setShowProjectPicker(false);
  };

  const handleQuickDate = async (isoValue: string) => {
    if (!task || isCreate) return;
    try {
      await updateTask.mutateAsync({ uid: task.uid, data: { due_date: isoValue } });
    } catch {
      showToast('error', '日期更新失败');
    }
  };

  const handleClearDate = async (field: 'due_date' | 'start_date') => {
    if (!task || isCreate) return;
    try {
      await updateTask.mutateAsync({ uid: task.uid, data: { [field]: null } });
    } catch {
      showToast('error', '清除日期失败');
    }
  };

  const handleToggleTag = async (tagUid: string) => {
    if (!task || isCreate) return;
    const currentTagUids = task.tags.map((t: Tag) => t.uid);
    const newTagUids = currentTagUids.includes(tagUid)
      ? currentTagUids.filter((id: string) => id !== tagUid)
      : [...currentTagUids, tagUid];
    try {
      await updateTask.mutateAsync({ uid: task.uid, data: { tag_uids: newTagUids } });
    } catch {
      showToast('error', '标签更新失败');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteTask.mutateAsync(task.uid);
      showToast('success', '任务已删除');
      router.back();
    } catch {
      showToast('error', '删除失败');
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast('error', '请输入任务标题');
      return;
    }
    try {
      const data: Record<string, any> = {
        title: title.trim(),
        priority: createPriority,
      };
      if (content.trim()) data.content = content.trim();
      if (createProjectUid) data.project_uid = createProjectUid;
      await createTask.mutateAsync(data);
      showToast('success', '任务创建成功');
      router.back();
    } catch {
      showToast('error', '创建失败');
    }
  };

  if (isLoading && !isCreate) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === task?.status) || STATUS_OPTIONS[1];
  const currentPriority = isCreate
    ? PRIORITY_OPTIONS.find((p) => p.value === createPriority) || PRIORITY_OPTIONS[1]
    : PRIORITY_OPTIONS.find((p) => p.value === task?.priority) || PRIORITY_OPTIONS[1];
  const currentProject = isCreate
    ? projects.find((p) => p.uid === createProjectUid)
    : task?.project;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Text style={{ color: Colors.primary, fontSize: 16 }}>{isCreate ? '✕' : '← 返回'}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          {saveStatus === 'saving' && <Text style={{ color: '#9ca3af', fontSize: 12 }}>保存中...</Text>}
          {saveStatus === 'saved' && <Text style={{ color: Colors.success, fontSize: 12 }}>已保存</Text>}
        </View>
        {isCreate ? (
          <TouchableOpacity onPress={handleCreate} style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.primary, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>创建</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => setShowMoreMenu(true)} style={{ padding: 6 }}>
              <Text style={{ fontSize: 18, color: '#6b7280' }}>⋯</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Title + Complete checkbox */}
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              {!isCreate && (
                <TouchableOpacity onPress={handleToggleComplete} style={{ paddingTop: 4 }}>
                  <Text style={{ fontSize: 24, color: task?.is_completed ? Colors.success : '#d1d5db' }}>
                    {task?.is_completed ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              )}
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 20,
                  fontWeight: '600',
                  color: task?.is_completed ? '#9ca3af' : '#111418',
                  lineHeight: 28,
                  textDecorationLine: task?.is_completed ? 'line-through' : 'none',
                }}
                placeholder="任务标题"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                multiline
              />
            </View>
          </View>

          {/* Properties section */}
          <View style={{ backgroundColor: '#fff', marginTop: 8, borderRadius: 0 }}>
            {/* Status */}
            {!isCreate && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
                onPress={() => setShowStatusSheet(true)}
              >
                <Text style={{ color: '#9ca3af', fontSize: 14, width: 70 }}>状态</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: currentStatus.color }} />
                  <Text style={{ fontSize: 14, color: '#374151' }}>{currentStatus.label}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Priority */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ color: '#9ca3af', fontSize: 14, width: 70 }}>优先级</Text>
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                {PRIORITY_OPTIONS.map((opt) => {
                  const isActive = (isCreate ? createPriority : task?.priority) === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isActive ? opt.color + '18' : '#f3f4f6',
                        borderWidth: 1,
                        borderColor: isActive ? opt.color : '#e5e7eb',
                      }}
                      onPress={() => handlePriorityChange({ value: opt.value, label: opt.label })}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? opt.color : '#9ca3af' }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Project */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
              onPress={() => setShowProjectPicker(true)}
            >
              <Text style={{ color: '#9ca3af', fontSize: 14, width: 70 }}>项目</Text>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <Text style={{ fontSize: 14, color: currentProject ? '#374151' : '#9ca3af' }}>
                  {currentProject?.name || '收集箱'}
                </Text>
                <Text style={{ color: '#d1d5db' }}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Due date - DatePicker component */}
            {!isCreate && task && (
              <DatePicker
                label="截止"
                value={task.due_date}
                onChange={(val) => {
                  updateTask.mutateAsync({ uid: task.uid, data: { due_date: val || undefined } }).catch(() => showToast('error', '日期更新失败'));
                }}
                isOverdue={task.is_overdue}
              />
            )}

            {/* Start date - DatePicker component */}
            {!isCreate && task && (
              <DatePicker
                label="开始"
                value={task.start_date}
                onChange={(val) => {
                  updateTask.mutateAsync({ uid: task.uid, data: { start_date: val || undefined } }).catch(() => showToast('error', '日期更新失败'));
                }}
              />
            )}
            {!isCreate && task && (
              <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
                onPress={() => setShowTagPicker(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Text style={{ color: '#9ca3af', fontSize: 14, width: 70, paddingTop: 4 }}>标签</Text>
                  <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 }}>
                    {task.tags.map((tag: Tag) => (
                      <View key={tag.uid} style={{ backgroundColor: tag.color + '20', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tag.color }} />
                        <Text style={{ color: tag.color, fontSize: 12, fontWeight: '500' }}>{tag.name}</Text>
                      </View>
                    ))}
                    {task.tags.length === 0 && (
                      <Text style={{ fontSize: 13, color: '#d1d5db' }}>点击添加标签</Text>
                    )}
                    <Text style={{ color: '#d1d5db' }}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Subtasks - full interactive list */}
          {!isCreate && task && (
            <SubtaskList
              parentTask={task}
              subtasks={subtasks}
              onRefresh={() => refetchSubtasks()}
            />
          )}

          {/* Attachments */}
          {!isCreate && task && (
            <AttachmentList
              attachments={task.attachments || []}
              onContentInsert={(text) => setContent((prev) => prev + text)}
            />
          )}

          {/* Content / Notes */}
          <View style={{ backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>备注</Text>
            <TextInput
              style={{ fontSize: 15, color: '#374151', lineHeight: 22, minHeight: 100 }}
              placeholder="添加备注..."
              placeholderTextColor="#9ca3af"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Completed time */}
          {!isCreate && task?.completed_time && (
            <View style={{ backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: Colors.success, fontSize: 14 }}>✓</Text>
                <Text style={{ fontSize: 13, color: '#9ca3af' }}>
                  完成于 {new Date(task.completed_time).toLocaleString('zh-CN')}
                </Text>
              </View>
            </View>
          )}

          {/* Parent task link */}
          {!isCreate && task?.parent && (
            <TouchableOpacity
              style={{ backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
              onPress={() => router.push(`/task/${task.parent}`)}
            >
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>↑</Text>
              <Text style={{ fontSize: 13, color: Colors.primary }}>查看父任务</Text>
            </TouchableOpacity>
          )}

          {/* Activity Log */}
          {!isCreate && task && (
            <ActivityLog taskUid={task.uid} />
          )}

          {/* Meta info */}
          {!isCreate && task && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
              <Text style={{ fontSize: 11, color: '#d1d5db' }}>
                创建于 {new Date(task.created_at).toLocaleString('zh-CN')}
              </Text>
              <Text style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>
                更新于 {new Date(task.updated_at).toLocaleString('zh-CN')}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Sheets */}
      <ActionSheet
        visible={showStatusSheet}
        title="选择状态"
        options={STATUS_OPTIONS.map((s) => ({ ...s, value: String(s.value) }))}
        onSelect={(opt) => handleStatusChange({ ...opt, value: parseInt(opt.value as string), label: opt.label })}
        onCancel={() => setShowStatusSheet(false)}
      />

      <ActionSheet
        visible={showPrioritySheet}
        title="选择优先级"
        options={PRIORITY_OPTIONS.map((p) => ({ ...p, value: String(p.value), icon: '⚑' }))}
        onSelect={(opt) => handlePriorityChange({ ...opt, value: parseInt(opt.value as string), label: opt.label })}
        onCancel={() => setShowPrioritySheet(false)}
      />

      {/* Project Picker */}
      <ActionSheet
        visible={showProjectPicker}
        title="选择项目"
        options={[
          { label: '收集箱（无项目）', value: '__none__', icon: '📥', color: '#9ca3af' },
          ...projects.map((p: Project) => ({
            label: p.name,
            value: p.uid,
            icon: '📁',
            color: '#374151',
          })),
        ]}
        onSelect={(opt) => handleProjectChange(opt.value === '__none__' ? null : opt.value as string)}
        onCancel={() => setShowProjectPicker(false)}
      />

      {/* More menu */}
      <ActionSheet
        visible={showMoreMenu}
        title="更多操作"
        options={[
          ...(task?.status !== TaskStatus.ABANDONED
            ? [{ label: '放弃任务', value: 'abandon', icon: '🚫', color: '#f59e0b' }]
            : [{ label: '恢复任务', value: 'restore', icon: '↩️', color: '#3b82f6' }]),
          { label: '删除任务', value: 'delete', icon: '🗑', color: '#ef4444', destructive: true },
        ]}
        onSelect={(opt) => {
          if (opt.value === 'delete') {
            setShowDeleteConfirm(true);
          } else if (opt.value === 'abandon' && task) {
            updateTask.mutateAsync({ uid: task.uid, data: { status: TaskStatus.ABANDONED } });
            showToast('info', '任务已放弃');
          } else if (opt.value === 'restore' && task) {
            updateTask.mutateAsync({ uid: task.uid, data: { status: TaskStatus.TODO } });
            showToast('success', '任务已恢复');
          }
        }}
        onCancel={() => setShowMoreMenu(false)}
      />

      {/* Tag Picker */}
      {!isCreate && task && (
        <TagPicker
          visible={showTagPicker}
          selectedTagUids={task.tags.map((t: Tag) => t.uid)}
          onToggleTag={handleToggleTag}
          onClose={() => setShowTagPicker(false)}
        />
      )}

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="删除任务"
        message={task?.subtasks_count ? `该任务包含 ${task.subtasks_count} 个子任务，删除后无法恢复` : '确认删除该任务？此操作无法撤销。'}
        confirmText="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </SafeAreaView>
  );
}
