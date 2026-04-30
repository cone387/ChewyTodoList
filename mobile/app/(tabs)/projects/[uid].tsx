import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useProject, useUpdateProject, useDeleteProject } from '../../../hooks/useProjects';
import { useTasks } from '../../../hooks/useTasks';
import { ListView } from '../../../components/views/ListView';
import { FAB } from '../../../components/ui/FAB';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../hooks/useToast';
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';
import { useTaskModal } from '../../../hooks/useTaskModal';
import type { Task } from '../../../shared/types/index';

export default function ProjectDetailPage() {
  const { colors } = useTheme();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { data: project, isLoading } = useProject(uid);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { showToast } = useToast();
  const { openTask, openCreateTask } = useTaskModal();

  const { data: taskData, isLoading: tasksLoading, refetch, isRefetching } = useTasks({ project: uid });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const tasks = taskData?.results || [];

  const handleTaskPress = useCallback((task: Task) => {
    openTask(task.uid);
  }, [openTask]);

  const handleSaveName = async () => {
    if (!project || !editName.trim()) return;
    try {
      await updateProject.mutateAsync({ uid: project.uid, data: { name: editName.trim() } });
      showToast('success', '项目名称已更新');
    } catch {
      showToast('error', '更新失败');
    }
    setIsEditingName(false);
  };

  const handleDelete = async () => {
    if (!project) return;
    try {
      await deleteProject.mutateAsync(project.uid);
      showToast('success', '项目已删除');
      router.back();
    } catch {
      showToast('error', '删除失败');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text.muted, fontSize: 16 }}>项目不存在</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: Colors.primary }}>返回</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Text style={{ color: Colors.primary, fontSize: 16 }}>← 返回</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          {isEditingName ? (
            <TextInput
              style={{ fontSize: 17, fontWeight: '600', color: colors.text.primary, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 2, minWidth: 120 }}
              value={editName}
              onChangeText={setEditName}
              onBlur={handleSaveName}
              onSubmitEditing={handleSaveName}
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => { setEditName(project.name); setIsEditingName(true); }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text.primary }}>{project.name}</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowDeleteConfirm(true)} style={{ padding: 6 }}>
          <Text style={{ color: colors.error, fontSize: 14 }}>删除</Text>
        </TouchableOpacity>
      </View>

      {/* Project info */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', gap: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.primary }}>{project.tasks_count || 0}</Text>
          <Text style={{ fontSize: 11, color: colors.text.muted }}>总任务</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.success }}>{project.completed_tasks_count || 0}</Text>
          <Text style={{ fontSize: 11, color: colors.text.muted }}>已完成</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.text.muted }}>{project.group?.name}</Text>
        </View>
      </View>

      {/* Task list */}
      <View style={{ flex: 1 }}>
        <ListView
          tasks={tasks}
          onTaskPress={handleTaskPress}
          onRefresh={() => refetch()}
          isRefreshing={isRefetching}
          isLoading={tasksLoading}
          emptyMessage="该项目暂无任务"
        />
      </View>

      <FAB onPress={() => openCreateTask(uid)} />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="删除项目"
        message={`确认删除项目「${project.name}」？若项目下仍有任务将无法删除，请先清空任务。`}
        confirmText="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </SafeAreaView>
  );
}
