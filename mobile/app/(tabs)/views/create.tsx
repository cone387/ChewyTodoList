import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { viewApi } from '../../../shared/services/api';
import { useProjects } from '../../../hooks/useProjects';
import { ActionSheet } from '../../../components/ui/ActionSheet';
import { useToast } from '../../../hooks/useToast';
import { Colors } from '../../../constants/theme';
import { useQueryClient } from '@tanstack/react-query';
import type { Project } from '../../../shared/types/index';

const VIEW_TYPES = [
  { label: '列表', value: 'list', icon: '☰', desc: '以列表形式展示任务' },
  { label: '看板', value: 'board', icon: '⊞', desc: '按状态分列展示' },
  { label: '日历', value: 'calendar', icon: '📅', desc: '在日历上查看任务' },
  { label: '表格', value: 'table', icon: '⊟', desc: '多字段表格视图' },
  { label: '时间线', value: 'timeline', icon: '⟶', desc: '按时间轴展示' },
  { label: '画廊', value: 'gallery', icon: '⊡', desc: '卡片网格视图' },
];

export default function CreateViewPage() {
  const { data: projectsData } = useProjects();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const projects: Project[] = (projectsData as Project[]) || [];

  const [name, setName] = useState('');
  const [viewType, setViewType] = useState('list');
  const [projectUid, setProjectUid] = useState<string | null>(null);
  const [isVisibleInNav, setIsVisibleInNav] = useState(true);
  const [followSelectedProject, setFollowSelectedProject] = useState(true);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProject = projects.find((p) => p.uid === projectUid);

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast('error', '请输入视图名称');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: Record<string, any> = {
        name: name.trim(),
        view_type: viewType,
        is_visible_in_nav: isVisibleInNav,
        follow_selected_project: followSelectedProject,
      };
      if (projectUid) data.project_uid = projectUid;
      await viewApi.createView(data);
      queryClient.invalidateQueries({ queryKey: ['views'] });
      showToast('success', '视图创建成功');
      router.back();
    } catch {
      showToast('error', '创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Text style={{ color: Colors.primary, fontSize: 16 }}>取消</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#111418' }}>新建视图</Text>
        </View>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={isSubmitting}
          style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.primary, borderRadius: 8, opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>创建</Text>
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
            autoFocus
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
                  width: '31%',
                  backgroundColor: viewType === vt.value ? '#f3f0ff' : '#fff',
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: viewType === vt.value ? Colors.primary : '#e5e7eb',
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
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 8 }}>关联项目（可选）</Text>
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
      </ScrollView>

      {/* Project picker */}
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
    </SafeAreaView>
  );
}
