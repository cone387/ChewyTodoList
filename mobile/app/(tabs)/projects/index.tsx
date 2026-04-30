import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProjects, useCreateProject, useDeleteProject } from '../../../hooks/useProjects';
import { useGroups, useCreateGroup, useDeleteGroup } from '../../../hooks/useGroups';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ActionSheet } from '../../../components/ui/ActionSheet';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';
import { useToast } from '../../../hooks/useToast';
import { useTheme } from '../../../hooks/useTheme';
import { Colors, Shadows } from '../../../constants/theme';
import type { Project, Group } from '../../../shared/types/index';

export default function ProjectsPage() {
  const { colors, isDark } = useTheme();
  const PRESET_ICONS = [
    'folder', 'briefcase', 'account', 'cart', 'airplane', 'book-open-page-variant', 'home', 'code-tags',
    'calendar', 'clipboard-text', 'target', 'lightbulb-on-outline', 'rocket-launch-outline', 'music-note',
    'camera', 'palette', 'heart', 'star', 'dumbbell', 'food-apple', 'shield-check', 'bank', 'laptop',
  ];
  const PRESET_COLORS = ['#8b5cf6', '#3b82f6', '#f97316', '#22c55e', '#ec4899', '#6366f1', '#14b8a6', '#ef4444'];
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
  const [newProjectIcon, setNewProjectIcon] = useState('folder');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
  const [newGroupName, setNewGroupName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'project' | 'group'; uid: string; name: string } | null>(null);
  const [groupMenuGroup, setGroupMenuGroup] = useState<Group | null>(null);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

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
      await createProject.mutateAsync({
        name: newProjectName.trim(),
        group_uid: newProjectGroupUid,
        style: { icon: newProjectIcon, color: newProjectColor },
      });
      showToast('success', '项目创建成功');
      setNewProjectName('');
      setNewProjectGroupUid('');
      setNewProjectIcon('folder');
      setNewProjectColor('#3b82f6');
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
        <View style={{ width: 32 }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text.primary }}>项目</Text>
        </View>
        <View style={{ width: 32, alignItems: 'flex-end', justifyContent: 'center', position: 'relative' }}>
          <TouchableOpacity onPress={() => setShowCreateMenu((prev) => !prev)} style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="plus" size={22} color={Colors.primary} />
          </TouchableOpacity>
          {showCreateMenu && (
            <View style={{ position: 'absolute', right: 0, top: 28, width: 152, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 4, zIndex: 20, ...Shadows.low }}>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateMenu(false);
                  setShowCreateGroup(false);
                  setShowCreateProject(true);
                  if (groups.length > 0 && !newProjectGroupUid) setNewProjectGroupUid(groups[0].uid);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}
              >
                <MaterialCommunityIcons name="format-list-bulleted-square" size={17} color={Colors.primary} />
                <Text style={{ fontSize: 14, color: colors.text.secondary }}>新建清单</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateMenu(false);
                  setShowCreateProject(false);
                  setShowCreateGroup(true);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}
              >
                <MaterialCommunityIcons name="folder-plus-outline" size={17} color="#f97316" />
                <Text style={{ fontSize: 14, color: colors.text.secondary }}>新建分组</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, paddingTop: 16 }}>
          <View style={{ marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' }}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Grouped projects */}
          {groupedProjects.map(({ group, projects: groupProjects }) => (
            <View key={group.uid} style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.muted, flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {group.name}
                </Text>
                <TouchableOpacity
                  onPress={() => { setGroupMenuGroup(group); setShowGroupMenu(true); }}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialCommunityIcons name="dots-horizontal" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {groupProjects.length === 0 ? (
                <View style={{ marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: colors.text.muted, fontSize: 13 }}>暂无项目</Text>
                </View>
              ) : (
                <View style={{ marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', ...Shadows.low }}>
                  {groupProjects.map((project, idx) => {
                    const projectIcon = (project.style?.icon as string) || 'folder';
                    const projectColor = (project.style?.color as string) || Colors.primary;
                    return (
                    <TouchableOpacity
                      key={project.uid}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: idx < groupProjects.length - 1 ? 1 : 0,
                        borderBottomColor: colors.borderLight,
                      }}
                      onPress={() => router.push(`/projects/${project.uid}` as any)}
                      onLongPress={() => setDeleteConfirm({ type: 'project', uid: project.uid, name: project.name })}
                      accessibilityRole="button"
                      accessibilityLabel={`项目 ${project.name}，${project.tasks_count || 0} 个任务`}
                      accessibilityHint="长按删除"
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: projectColor + '1F', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <MaterialCommunityIcons name={projectIcon as any} size={18} color={projectColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text.primary }}>{project.name}</Text>
                        {project.desc ? (
                          <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }} numberOfLines={1}>{project.desc}</Text>
                        ) : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 13, color: colors.text.muted }}>{project.tasks_count || 0}</Text>
                        <Text style={{ fontSize: 11, color: colors.text.muted }}>任务</Text>
                      </View>
                    </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}

          {groupedProjects.length === 0 && !isLoading && (
            <EmptyState
              icon="folder-multiple-outline"
              message="暂无项目"
              description="点击右上角创建分组和项目"
            />
          )}
        </ScrollView>
      )}

      <Modal visible={showCreateProject} transparent animationType="slide" onRequestClose={() => setShowCreateProject(false)}>
        <TouchableWithoutFeedback onPress={() => setShowCreateProject(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, gap: 12, maxHeight: '75%' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>新建清单</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text.primary, backgroundColor: colors.background.secondary }}
                  placeholder="输入清单名称..."
                  placeholderTextColor={colors.text.muted}
                  value={newProjectName}
                  onChangeText={setNewProjectName}
                  autoFocus
                />
                <TouchableOpacity
                  style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.background.secondary, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => setShowGroupPicker(true)}
                >
                  <Text style={{ flex: 1, fontSize: 14, color: selectedGroup ? colors.text.secondary : colors.text.muted }}>
                    {selectedGroup ? selectedGroup.name : '选择分组'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color="#9ca3af" />
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: colors.text.muted }}>图标</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {PRESET_ICONS.map((icon) => (
                    <TouchableOpacity key={icon} onPress={() => setNewProjectIcon(icon)} style={{ width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: newProjectIcon === icon ? (isDark ? Colors.primary + '22' : '#eef2ff') : colors.background.secondary, borderWidth: 1, borderColor: newProjectIcon === icon ? Colors.primary : colors.border }}>
                      <MaterialCommunityIcons name={icon as any} size={18} color={newProjectIcon === icon ? Colors.primary : colors.text.secondary} />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: colors.text.muted }}>颜色</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {PRESET_COLORS.map((color) => (
                    <TouchableOpacity key={color} onPress={() => setNewProjectColor(color)} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color, borderWidth: newProjectColor === color ? 2 : 0, borderColor: colors.text.primary }} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                  <TouchableOpacity onPress={() => setShowCreateProject(false)} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                    <Text style={{ color: colors.text.secondary, fontSize: 14 }}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCreateProject} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>创建清单</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showCreateGroup} transparent animationType="slide" onRequestClose={() => setShowCreateGroup(false)}>
        <TouchableWithoutFeedback onPress={() => setShowCreateGroup(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, gap: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>新建分组</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text.primary, backgroundColor: colors.background.secondary }}
                  placeholder="输入分组名称..."
                  placeholderTextColor={colors.text.muted}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                  <TouchableOpacity onPress={() => setShowCreateGroup(false)} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                    <Text style={{ color: colors.text.secondary, fontSize: 14 }}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCreateGroup} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>创建分组</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {showCreateMenu && (
        <TouchableWithoutFeedback onPress={() => setShowCreateMenu(false)}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }} />
        </TouchableWithoutFeedback>
      )}

      {/* Group picker for create project */}
      <Modal visible={showGroupPicker} transparent animationType="fade" onRequestClose={() => setShowGroupPicker(false)}>
        <TouchableWithoutFeedback onPress={() => setShowGroupPicker(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', paddingHorizontal: 24 }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' }}>
                <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary }}>选择分组</Text>
                </View>
                {groups.map((g) => (
                  <TouchableOpacity key={g.uid} onPress={() => { setNewProjectGroupUid(g.uid); setShowGroupPicker(false); }} style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
                    <Text style={{ fontSize: 14, color: colors.text.secondary }}>{g.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setShowGroupPicker(false)} style={{ paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: colors.text.secondary }}>取消</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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

      <ActionSheet
        visible={showGroupMenu}
        title={groupMenuGroup?.name || '分组'}
        options={[{ label: '删除分组', value: 'delete', icon: '🗑', color: '#ef4444', destructive: true }]}
        onSelect={(opt) => {
          if (opt.value === 'delete' && groupMenuGroup) {
            setDeleteConfirm({ type: 'group', uid: groupMenuGroup.uid, name: groupMenuGroup.name });
          }
          setShowGroupMenu(false);
          setGroupMenuGroup(null);
        }}
        onCancel={() => { setShowGroupMenu(false); setGroupMenuGroup(null); }}
      />
    </SafeAreaView>
  );
}
