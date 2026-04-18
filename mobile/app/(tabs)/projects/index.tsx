import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProjects, useCreateProject, useDeleteProject } from '../../../hooks/useProjects';
import { useGroups, useCreateGroup, useDeleteGroup } from '../../../hooks/useGroups';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ActionSheet } from '../../../components/ui/ActionSheet';
import { useToast } from '../../../hooks/useToast';
import { Colors } from '../../../constants/theme';
import type { Project, Group } from '../../../shared/types/index';

export default function ProjectsPage() {
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: groupsData, isLoading: groupsLoading } = useGroups();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const { showToast } = useToast();

  const projects: Project[] = (projectsData as Project[]) || [];
  const groups: Group[] = (groupsData as Group[]) || [];

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGroupUid, setNewProjectGroupUid] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'project' | 'group'; uid: string; name: string } | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  // Group projects by group
  const groupedProjects = useMemo(() => {
    const map = new Map<string, { group: Group; projects: Project[] }>();
    groups.forEach((g) => map.set(g.uid, { group: g, projects: [] }));
    projects.forEach((p) => {
      const entry = map.get(p.group?.uid);
      if (entry) entry.projects.push(p);
    });
    return Array.from(map.values());
  }, [projects, groups]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      showToast('error', '请输入项目名称');
      return;
    }
    if (!newProjectGroupUid) {
      showToast('error', '请选择分组');
      return;
    }
    try {
      await createProject.mutateAsync({ name: newProjectName.trim(), group_uid: newProjectGroupUid });
      showToast('success', '项目创建成功');
      setNewProjectName('');
      setNewProjectGroupUid('');
      setShowCreateProject(false);
    } catch {
      showToast('error', '创建失败');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      showToast('error', '请输入分组名称');
      return;
    }
    try {
      await createGroup.mutateAsync({ name: newGroupName.trim() });
      showToast('success', '分组创建成功');
      setNewGroupName('');
      setShowCreateGroup(false);
    } catch {
      showToast('error', '创建失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'project') {
        await deleteProject.mutateAsync(deleteConfirm.uid);
      } else {
        await deleteGroup.mutateAsync(deleteConfirm.uid);
      }
      showToast('success', `${deleteConfirm.type === 'project' ? '项目' : '分组'}已删除`);
    } catch {
      showToast('error', '删除失败');
    }
    setDeleteConfirm(null);
  };

  const isLoading = projectsLoading || groupsLoading;

  const selectedGroup = groups.find((g) => g.uid === newProjectGroupUid);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111418' }}>项目</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => setShowCreateGroup(true)}>
            <Text style={{ color: Colors.primary, fontSize: 14 }}>+ 分组</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowCreateProject(true); if (groups.length > 0 && !newProjectGroupUid) setNewProjectGroupUid(groups[0].uid); }}>
            <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '600' }}>+ 项目</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Create Group inline */}
          {showCreateGroup && (
            <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, gap: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>新建分组</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111418', backgroundColor: '#f9fafb' }}
                placeholder="分组名称"
                placeholderTextColor="#9ca3af"
                value={newGroupName}
                onChangeText={setNewGroupName}
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => { setShowCreateGroup(false); setNewGroupName(''); }} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: '#6b7280', fontSize: 14 }}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateGroup} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.primary, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>创建</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Create Project inline */}
          {showCreateProject && (
            <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, gap: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>新建项目</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111418', backgroundColor: '#f9fafb' }}
                placeholder="项目名称"
                placeholderTextColor="#9ca3af"
                value={newProjectName}
                onChangeText={setNewProjectName}
                autoFocus
              />
              <TouchableOpacity
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f9fafb', flexDirection: 'row', alignItems: 'center' }}
                onPress={() => setShowGroupPicker(true)}
              >
                <Text style={{ flex: 1, fontSize: 14, color: selectedGroup ? '#374151' : '#9ca3af' }}>
                  {selectedGroup ? selectedGroup.name : '选择分组'}
                </Text>
                <Text style={{ color: '#9ca3af' }}>▼</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => { setShowCreateProject(false); setNewProjectName(''); }} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: '#6b7280', fontSize: 14 }}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateProject} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.primary, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>创建</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Grouped projects */}
          {groupedProjects.map(({ group, projects: groupProjects }) => (
            <View key={group.uid} style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {group.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setDeleteConfirm({ type: 'group', uid: group.uid, name: group.name })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ color: '#d1d5db', fontSize: 12 }}>⋯</Text>
                </TouchableOpacity>
              </View>

              {groupProjects.length === 0 ? (
                <View style={{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#d1d5db', fontSize: 13 }}>暂无项目</Text>
                </View>
              ) : (
                <View style={{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                  {groupProjects.map((project, idx) => (
                    <TouchableOpacity
                      key={project.uid}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: idx < groupProjects.length - 1 ? 1 : 0,
                        borderBottomColor: '#f3f4f6',
                      }}
                      onPress={() => router.push(`/projects/${project.uid}` as any)}
                      onLongPress={() => setDeleteConfirm({ type: 'project', uid: project.uid, name: project.name })}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f0ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ fontSize: 16 }}>📋</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '500', color: '#111418' }}>{project.name}</Text>
                        {project.desc ? (
                          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }} numberOfLines={1}>{project.desc}</Text>
                        ) : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 13, color: '#9ca3af' }}>{project.tasks_count || 0}</Text>
                        <Text style={{ fontSize: 11, color: '#d1d5db' }}>任务</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {groupedProjects.length === 0 && !isLoading && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
              <Text style={{ fontSize: 16, color: '#9ca3af' }}>暂无项目</Text>
              <Text style={{ fontSize: 13, color: '#d1d5db', marginTop: 4 }}>点击右上角创建分组和项目</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Group picker for create project */}
      <ActionSheet
        visible={showGroupPicker}
        title="选择分组"
        options={groups.map((g) => ({ label: g.name, value: g.uid }))}
        onSelect={(opt) => { setNewProjectGroupUid(opt.value as string); setShowGroupPicker(false); }}
        onCancel={() => setShowGroupPicker(false)}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        visible={!!deleteConfirm}
        title={`删除${deleteConfirm?.type === 'project' ? '项目' : '分组'}`}
        message={`确认删除「${deleteConfirm?.name}」？此操作无法撤销。`}
        confirmText="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </SafeAreaView>
  );
}
