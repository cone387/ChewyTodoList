import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCardConfigs, useUpdateCardConfig, useDuplicateCardConfig, useDeleteCardConfig } from '../../../hooks/useCardConfigs';
import { TaskCard } from '../../../components/task/TaskCard';
import { ActionSheet } from '../../../components/ui/ActionSheet';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../hooks/useToast';
import { Colors } from '../../../constants/theme';
import type { TaskCardConfig, CardFieldConfig, Task } from '../../../shared/types/index';
import { TaskStatus, TaskPriority } from '../../../shared/types/index';

// Mock task for preview
const PREVIEW_TASK: Task = {
  uid: 'preview',
  title: '示例任务标题',
  content: '这是一个示例任务的描述内容',
  status: TaskStatus.TODO,
  status_display: '待办',
  priority: TaskPriority.HIGH,
  priority_display: '高',
  project: { uid: 'p1', name: '示例项目', group: { uid: 'g1', name: '默认分组', sort_order: 0, settings: {}, created_at: '', updated_at: '', projects_count: 1 }, view_type: 'list', style: {}, settings: {}, sort_order: 0, created_at: '', updated_at: '', tasks_count: 5, completed_tasks_count: 2, desc: '' },
  tags: [
    { uid: 't1', name: '重要', color: '#ef4444', sort_order: 0, created_at: '', updated_at: '' },
    { uid: 't2', name: '工作', color: '#3b82f6', sort_order: 1, created_at: '', updated_at: '' },
  ],
  is_all_day: false,
  due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
  time_zone: 'Asia/Shanghai',
  sort_order: 0,
  attachments: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_completed: false,
  is_overdue: false,
  subtasks_count: 3,
  completed_subtasks_count: 1,
};

const LAYOUT_OPTIONS = [
  { label: '紧凑', value: 'compact' },
  { label: '舒适', value: 'comfortable' },
  { label: '宽松', value: 'spacious' },
];

export default function CardConfigsPage() {
  const { data: configs, isLoading } = useCardConfigs();
  const updateConfig = useUpdateCardConfig();
  const duplicateConfig = useDuplicateCardConfig();
  const deleteConfig = useDeleteCardConfig();
  const { showToast } = useToast();

  const allConfigs: TaskCardConfig[] = (configs as TaskCardConfig[]) || [];

  const [selectedConfig, setSelectedConfig] = useState<TaskCardConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<TaskCardConfig | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  const handleDuplicate = async (config: TaskCardConfig) => {
    try {
      await duplicateConfig.mutateAsync(config.uid);
      showToast('success', '已创建副本');
    } catch {
      showToast('error', '复制失败');
    }
  };

  const handleDelete = async () => {
    if (!selectedConfig) return;
    try {
      await deleteConfig.mutateAsync(selectedConfig.uid);
      showToast('success', '配置已删除');
    } catch {
      showToast('error', '删除失败');
    }
    setShowDeleteConfirm(false);
    setSelectedConfig(null);
  };

  const handleToggleField = async (config: TaskCardConfig, fieldName: string) => {
    const newFieldConfigs = config.field_configs.map((fc) =>
      fc.field === fieldName ? { ...fc, visible: !fc.visible } : fc
    );
    try {
      await updateConfig.mutateAsync({ uid: config.uid, data: { field_configs: newFieldConfigs } });
    } catch {
      showToast('error', '更新失败');
    }
  };

  const handleChangeLayout = async (config: TaskCardConfig, layout: string) => {
    try {
      await updateConfig.mutateAsync({ uid: config.uid, data: { layout: layout as any } });
      showToast('success', '布局已更新');
    } catch {
      showToast('error', '更新失败');
    }
    setShowLayoutPicker(false);
  };

  const presetConfigs = allConfigs.filter((c) => c.is_preset);
  const userConfigs = allConfigs.filter((c) => !c.is_preset);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Text style={{ color: Colors.primary, fontSize: 16 }}>← 返回</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#111418' }}>卡片配置</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* User configs */}
          {userConfigs.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase' }}>
                自定义配置
              </Text>
              {userConfigs.map((config) => (
                <View key={config.uid} style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Preview */}
                  <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                    <TaskCard task={PREVIEW_TASK} cardConfig={config} onPress={() => {}} />
                  </View>
                  {/* Config info */}
                  <View style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>{config.name}</Text>
                      <TouchableOpacity onPress={() => { setSelectedConfig(config); setShowActions(true); }}>
                        <Text style={{ color: '#9ca3af', fontSize: 14 }}>⋯</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                      布局: {LAYOUT_OPTIONS.find((l) => l.value === config.layout)?.label || config.layout}
                      {' · '}
                      {config.field_configs.filter((f) => f.visible).length}/{config.field_configs.length} 字段可见
                    </Text>

                    {/* Field toggles */}
                    <View style={{ marginTop: 10, gap: 6 }}>
                      {config.field_configs.map((fc) => (
                        <View key={fc.field} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 13, color: '#6b7280' }}>{fc.field}</Text>
                          <Switch
                            value={fc.visible}
                            onValueChange={() => handleToggleField(config, fc.field)}
                            trackColor={{ false: '#e5e7eb', true: Colors.primary + '60' }}
                            thumbColor={fc.visible ? Colors.primary : '#f4f3f4'}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Preset configs */}
          {presetConfigs.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase' }}>
                系统预设
              </Text>
              {presetConfigs.map((config) => (
                <View key={config.uid} style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                  <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                    <TaskCard task={PREVIEW_TASK} cardConfig={config} onPress={() => {}} />
                  </View>
                  <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>{config.name}</Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                        {LAYOUT_OPTIONS.find((l) => l.value === config.layout)?.label || config.layout}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                      onPress={() => handleDuplicate(config)}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>复制使用</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {allConfigs.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🎨</Text>
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>暂无卡片配置</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Config actions */}
      <ActionSheet
        visible={showActions}
        title={selectedConfig?.name || ''}
        options={[
          { label: '修改布局', value: 'layout', icon: '📐' },
          { label: '复制配置', value: 'duplicate', icon: '📋' },
          ...(!selectedConfig?.is_preset ? [{ label: '删除配置', value: 'delete', icon: '🗑', color: '#ef4444', destructive: true }] : []),
        ]}
        onSelect={(opt) => {
          if (opt.value === 'layout') {
            setShowActions(false);
            setEditingConfig(selectedConfig);
            setShowLayoutPicker(true);
          } else if (opt.value === 'duplicate' && selectedConfig) {
            handleDuplicate(selectedConfig);
          } else if (opt.value === 'delete') {
            setShowDeleteConfirm(true);
          }
          setShowActions(false);
        }}
        onCancel={() => { setShowActions(false); setSelectedConfig(null); }}
      />

      {/* Layout picker */}
      <ActionSheet
        visible={showLayoutPicker}
        title="选择布局密度"
        options={LAYOUT_OPTIONS.map((l) => ({ label: l.label, value: l.value }))}
        onSelect={(opt) => {
          if (editingConfig) handleChangeLayout(editingConfig, opt.value as string);
        }}
        onCancel={() => { setShowLayoutPicker(false); setEditingConfig(null); }}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="删除配置"
        message={`确认删除「${selectedConfig?.name}」？`}
        confirmText="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => { setShowDeleteConfirm(false); setSelectedConfig(null); }}
      />
    </SafeAreaView>
  );
}
