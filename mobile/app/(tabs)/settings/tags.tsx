import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../../../hooks/useTags';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../hooks/useToast';
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';
import type { Tag } from '../../../shared/types/index';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
];

export default function TagsPage() {
  const { colors } = useTheme();
  const { data: tagsData, isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const { showToast } = useToast();

  const tags: Tag[] = (tagsData as Tag[]) || [];

  const [showCreate, setShowCreate] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Tag | null>(null);

  const handleCreate = async () => {
    if (!newTagName.trim()) {
      showToast('error', '请输入标签名称');
      return;
    }
    try {
      await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
      showToast('success', '标签创建成功');
      setNewTagName('');
      setShowCreate(false);
    } catch {
      showToast('error', '创建失败');
    }
  };

  const handleUpdate = async () => {
    if (!editingTag || !editName.trim()) return;
    try {
      await updateTag.mutateAsync({ uid: editingTag.uid, data: { name: editName.trim(), color: editColor } });
      showToast('success', '标签已更新');
      setEditingTag(null);
    } catch {
      showToast('error', '更新失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTag.mutateAsync(deleteConfirm.uid);
      showToast('success', '标签已删除');
    } catch {
      showToast('error', '删除失败');
    }
    setDeleteConfirm(null);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Text style={{ color: Colors.primary, fontSize: 16 }}>← 返回</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text.primary }}>标签管理</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '600' }}>+ 新建</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Create form */}
          {showCreate && (
            <View style={{ backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, gap: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.secondary }}>新建标签</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text.primary, backgroundColor: colors.background.secondary }}
                placeholder="标签名称"
                placeholderTextColor={colors.text.muted}
                value={newTagName}
                onChangeText={setNewTagName}
                autoFocus
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={{
                      width: 32, height: 32, borderRadius: 16, backgroundColor: color,
                      borderWidth: 2, borderColor: newTagColor === color ? '#111418' : 'transparent',
                    }}
                    onPress={() => setNewTagColor(color)}
                  />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => { setShowCreate(false); setNewTagName(''); }} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: colors.text.secondary, fontSize: 14 }}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreate} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.primary, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>创建</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Edit form */}
          {editingTag && (
            <View style={{ backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, gap: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.secondary }}>编辑标签</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text.primary, backgroundColor: colors.background.secondary }}
                value={editName}
                onChangeText={setEditName}
                autoFocus
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={{
                      width: 32, height: 32, borderRadius: 16, backgroundColor: color,
                      borderWidth: 2, borderColor: editColor === color ? '#111418' : 'transparent',
                    }}
                    onPress={() => setEditColor(color)}
                  />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setEditingTag(null)} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: colors.text.secondary, fontSize: 14 }}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdate} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.primary, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tags list */}
          {tags.length > 0 ? (
            <View style={{ marginTop: 16, marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' }}>
              {tags.map((tag, idx) => (
                <TouchableOpacity
                  key={tag.uid}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: idx < tags.length - 1 ? 1 : 0,
                    borderBottomColor: colors.borderLight,
                  }}
                  onPress={() => { setEditingTag(tag); setEditName(tag.name); setEditColor(tag.color); }}
                  onLongPress={() => setDeleteConfirm(tag)}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: tag.color, marginRight: 12 }} />
                  <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary }}>{tag.name}</Text>
                  <TouchableOpacity onPress={() => setDeleteConfirm(tag)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={{ color: colors.text.muted, fontSize: 14 }}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🏷</Text>
              <Text style={{ color: colors.text.muted, fontSize: 14 }}>暂无标签</Text>
            </View>
          )}
        </ScrollView>
      )}

      <ConfirmDialog
        visible={!!deleteConfirm}
        title="删除标签"
        message={`确认删除标签「${deleteConfirm?.name}」？`}
        confirmText="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </SafeAreaView>
  );
}
