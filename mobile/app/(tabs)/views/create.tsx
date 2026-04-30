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
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';
import { useQueryClient } from '@tanstack/react-query';
import type { Project, ViewFilter, ViewSort } from '../../../shared/types/index';
import { FilterBuilder } from '../../../components/views/FilterBuilder';

const VIEW_TYPES = [
  { label: '列表', value: 'list', icon: '☰', desc: '以列表形式展示任务' },
  { label: '看板', value: 'board', icon: '⊞', desc: '按状态分列展示' },
  { label: '日历', value: 'calendar', icon: '📅', desc: '在日历上查看任务' },
  { label: '表格', value: 'table', icon: '⊟', desc: '多字段表格视图' },
  { label: '时间线', value: 'timeline', icon: '⟶', desc: '按时间轴展示' },
  { label: '画廊', value: 'gallery', icon: '⊡', desc: '卡片网格视图' },
];

export default function CreateViewPage() {
  const { colors } = useTheme();
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
  const [filters, setFilters] = useState<ViewFilter[]>([]);
  const [sorts, setSorts] = useState<ViewSort[]>([]);

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
        filters,
        sorts,
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Text style={{ color: Colors.primary, fontSize: 16 }}>取消</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text.primary }}>新建视图</Text>
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
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.muted, marginBottom: 8 }}>视图名称</Text>
          <TextInput
            style={{ backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
            placeholder="输入视图名称"
            placeholderTextColor={colors.text.muted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        {/* View type */}
        <View style={{ marginTop: 20, marginHorizontal: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.muted, marginBottom: 8 }}>视图类型</Text>
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
                <Text style={{ fontSize: 13, fontWeight: '600', color: viewType === vt.value ? Colors.primary : colors.text.secondary }}>{vt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Project */}
        <View style={{ marginTop: 20, marginHorizontal: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.muted, marginBottom: 8 }}>关联项目（可选）</Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setShowProjectPicker(true)}
          >
            <Text style={{ flex: 1, fontSize: 14, color: followSelectedProject ? Colors.primary : (selectedProject ? '#374151' : colors.text.muted) }}>
              {followSelectedProject ? '跟随主页选择（默认）' : (selectedProject ? selectedProject.name : '不关联项目')}
            </Text>
            <Text style={{ color: colors.text.muted }}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={{ marginTop: 20, marginHorizontal: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.muted, marginBottom: 8 }}>筛选条件</Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
            <FilterBuilder filters={filters} onChange={setFilters} />
          </View>
        </View>

        {/* Settings */}
        <View style={{ marginTop: 20, marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: colors.text.secondary }}>显示在导航栏</Text>
              <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>在主页视图切换栏中显示</Text>
            </View>
            <Switch
              value={isVisibleInNav}
              onValueChange={setIsVisibleInNav}
              trackColor={{ false: '#e5e7eb', true: Colors.primary + '60' }}
              thumbColor={isVisibleInNav ? Colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>

      {/* Project picker */}
      <ActionSheet
        visible={showProjectPicker}
        title="选择项目"
        options={[
          { label: '跟随主页选择（默认）', value: '__follow__', icon: '🔄' },
          { label: '不关联项目', value: '__none__', icon: '📥' },
          ...projects.map((p) => ({ label: p.name, value: p.uid, icon: '📁' })),
        ]}
        onSelect={(opt) => {
          if (opt.value === '__follow__') { setFollowSelectedProject(true); setProjectUid(null); }
          else if (opt.value === '__none__') { setFollowSelectedProject(false); setProjectUid(null); }
          else { setFollowSelectedProject(false); setProjectUid(opt.value as string); }
          setShowProjectPicker(false);
        }}
        onCancel={() => setShowProjectPicker(false)}
      />
    </SafeAreaView>
  );
}
