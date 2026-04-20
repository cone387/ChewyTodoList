import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useView, useUpdateView, useDeleteView } from '../../../../hooks/useViews';
import { useProjects } from '../../../../hooks/useProjects';
import { ActionSheet } from '../../../../components/ui/ActionSheet';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { useToast } from '../../../../hooks/useToast';
import { Colors } from '../../../../constants/theme';
import type { Project, ViewFilter, ViewSort } from '../../../../shared/types/index';

const VIEW_TYPES = [
  { label: '列表', value: 'list', icon: '☰' },
  { label: '看板', value: 'board', icon: '⊞' },
  { label: '日历', value: 'calendar', icon: '📅' },
  { label: '表格', value: 'table', icon: '⊟' },
  { label: '时间线', value: 'timeline', icon: '⟶' },
  { label: '画廊', value: 'gallery', icon: '⊡' },
];

export default function EditViewPage() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { data: view, isLoading } = useView(uid);
  const updateView = useUpdateView();
  const deleteView = useDeleteView();
  const { data: projectsData } = useProjects();
  const { showToast } = useToast();

  const projects: Project[] = (projectsData as Project[]) || [];

  const [name, setName] = useState('');
  const [viewType, setViewType] = useState('list');
  const [projectUid, setProjectUid] = useState<string | null>(null);
  const [isVisibleInNav, setIsVisibleInNav] = useState(true);
  const [followSelectedProject, setFollowSelectedProject] = useState(true);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (view) {
      setName(view.name);
      setViewType(view.view_type);
      setProjectUid(view.project?.uid || null);
      setIsVisibleInNav(view.is_visible_in_nav);
      setFollowSelectedProject(view.follow_selected_project ?? true);
    }
  }, [view]);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('error', '请输入视图名称');
      return;
    }
    setIsSaving(true);
    try {
      const data: Record<string, any> = {
        name: name.trim(),
        view_type: viewType,
        is_visible_in_nav: isVisibleInNav,
        follow_selected_project: followSelectedProject,
      };
      if (projectUid) data.project_uid = projectUid;
      else data.project_uid = undefined;
      await updateView.mutateAsync({ uid, data });
      showToast('success', '视图已更新');
      router.back();
    } catch {
      showToast('error', '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteView.mutateAsync(uid);
      showToast('success', '视图已删除');
      router.back();
    } catch {
      showToast('error', '删除失败');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const selectedProject = projects.find((p) => p.uid === projectUid);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Text style={{ color: Colors.primary, fontSize: 16 }}>取消</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#111418' }}>编辑视图</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.primary, borderRadius: 8, opacity: isSaving ? 0.7 : 1 }}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>保存</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Name */}
        <View style={{ marginTop: 16, marginHorizontal: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 8 }}>视图名称</Text>
          <TextInput
            style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#111418', borderWidth: 1, borderColor: '#e5e7eb' }}
            placeholder="输入视图名称"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* View type */}
        <View style={{ marginTop: 20, marginHorizontal: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 8 }}>视图类型</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {VIEW_TYPES.map((vt) => (
              <TouchableOpacity
                key={vt.value}
                style={{
                  width: '31%', backgroundColor: viewType === vt.value ? '#f3f0ff' : '#fff',
                  borderRadius: 12, padding: 12, alignItems: 'center',
                  borderWidth: 1.5, borderColor: viewType === vt.value ? Colors.primary : '#e5e7eb',
                }}
                onPress={() => setViewType(vt.value)}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{vt.icon}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: viewType === vt.value ? Colors.primary : '#374151' }}>{vt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Project */}
        <View style={{ marginTop: 20, marginHorizontal: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 8 }}>关联项目</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setShowProjectPicker(true)}
          >
            <Text style={{ flex: 1, fontSize: 14, color: selectedProject ? '#374151' : '#9ca3af' }}>
              {selectedProject ? selectedProject.name : '不关联项目'}
            </Text>
            <Text style={{ color: '#9ca3af' }}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={{ marginTop: 20, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: '#374151' }}>显示在导航栏</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>在主页视图切换栏中显示</Text>
            </View>
            <Switch
              value={isVisibleInNav}
              onValueChange={setIsVisibleInNav}
              trackColor={{ false: '#e5e7eb', true: Colors.primary + '60' }}
              thumbColor={isVisibleInNav ? Colors.primary : '#f4f3f4'}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: '#374151' }}>跟随项目选择器</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>根据主页选择的项目动态过滤</Text>
            </View>
            <Switch
              value={followSelectedProject}
              onValueChange={setFollowSelectedProject}
              trackColor={{ false: '#e5e7eb', true: Colors.primary + '60' }}
              thumbColor={followSelectedProject ? Colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Danger zone */}
        {!view?.is_system && (
          <View style={{ marginTop: 32, marginHorizontal: 16 }}>
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(true)}
              style={{ paddingVertical: 14, backgroundColor: '#fef2f2', borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#ef4444' }}>删除视图</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ActionSheet
        visible={showProjectPicker}
        title="选择项目"
        options={[
          { label: '不关联项目', value: '__none__', icon: '📥' },
          ...projects.map((p) => ({ label: p.name, value: p.uid, icon: '📁' })),
        ]}
        onSelect={(opt) => { setProjectUid(opt.value === '__none__' ? null : opt.value as string); setShowProjectPicker(false); }}
        onCancel={() => setShowProjectPicker(false)}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="删除视图"
        message={`确认删除视图「${view?.name}」？此操作无法撤销。`}
        confirmText="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </SafeAreaView>
  );
}
