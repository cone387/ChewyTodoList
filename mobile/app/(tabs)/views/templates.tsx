import React, { useState, useMemo } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { viewApi } from '../../../shared/services/api';
import {
  VIEW_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getRecommendedTemplates,
  getViewTypeIcon,
  getViewTypeLabel,
} from '../../../data/viewTemplates';
import type { ViewTemplate } from '../../../data/viewTemplates';
import { useToast } from '../../../hooks/useToast';
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

export default function ViewTemplateMarketPage() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedViewType, setSelectedViewType] = useState<string>('all');
  const [creating, setCreating] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    let templates = VIEW_TEMPLATES;
    if (selectedCategory !== 'all') {
      templates = templates.filter((t) => t.category === selectedCategory);
    }
    if (selectedViewType !== 'all') {
      templates = templates.filter((t) => t.view_type === selectedViewType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return templates.sort((a, b) => b.usage_count - a.usage_count);
  }, [searchQuery, selectedCategory, selectedViewType]);

  const recommended = useMemo(() => getRecommendedTemplates(3), []);

  const handleCreateFromTemplate = async (template: ViewTemplate) => {
    setCreating(template.id);
    try {
      const ts = new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      await viewApi.createView({
        name: `${template.name} ${ts}`,
        view_type: template.view_type,
        filters: template.filters,
        sorts: template.sorts,
        group_by: template.group_by,
        view_settings: template.view_settings,
        is_visible_in_nav: true,
      });
      queryClient.invalidateQueries({ queryKey: ['views'] });
      showToast('success', `已从「${template.name}」创建视图`);
      router.back();
    } catch {
      showToast('error', '创建失败');
    } finally {
      setCreating(null);
    }
  };

  const renderTemplateCard = (template: ViewTemplate, isRecommended = false) => (
    <View
      key={template.id}
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: isRecommended ? 2 : 1,
        borderColor: isRecommended ? Colors.primary + '40' : '#e5e7eb',
        marginBottom: 12,
      }}
    >
      {/* Preview header */}
      <View style={{ backgroundColor: colors.background.secondary, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 28 }}>{template.icon}</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>{template.name}</Text>
            {isRecommended && (
              <View style={{ backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>推荐</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }} numberOfLines={2}>{template.description}</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
        {/* View type badge */}
        <View style={{ backgroundColor: Colors.primary + '14', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12 }}>{getViewTypeIcon(template.view_type)}</Text>
          <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '600' }}>{getViewTypeLabel(template.view_type)}</Text>
        </View>

        {/* Rating */}
        <Text style={{ fontSize: 11, color: '#f59e0b' }}>★ {template.rating}</Text>

        {/* Usage */}
        <Text style={{ fontSize: 11, color: colors.text.muted }}>{template.usage_count} 次使用</Text>

        <View style={{ flex: 1 }} />

        {/* Use button */}
        <TouchableOpacity
          style={{
            backgroundColor: Colors.primary,
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 6,
            opacity: creating === template.id ? 0.7 : 1,
          }}
          onPress={() => handleCreateFromTemplate(template)}
          disabled={creating === template.id}
        >
          {creating === template.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>使用</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tags */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {template.tags.map((tag) => (
          <View key={tag} style={{ backgroundColor: colors.background.tertiary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, color: colors.text.secondary }}>{tag}</Text>
          </View>
        ))}
        {/* Filter/sort count */}
        {template.filters.length > 0 && (
          <View style={{ backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, color: '#3b82f6' }}>{template.filters.length} 个筛选</Text>
          </View>
        )}
        {template.sorts.length > 0 && (
          <View style={{ backgroundColor: colors.success + '14', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, color: colors.success }}>{template.sorts.length} 个排序</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Text style={{ color: Colors.primary, fontSize: 16 }}>← 返回</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text.primary }}>视图广场</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/views/create' as any)}>
          <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '600' }}>+ 自定义</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <TextInput
          style={{ backgroundColor: colors.background.tertiary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: colors.text.primary }}
          placeholder="搜索视图模板..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category tabs */}
      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
              backgroundColor: selectedCategory === 'all' ? Colors.primary : '#f3f4f6',
            }}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: selectedCategory === 'all' ? '#fff' : colors.text.secondary }}>全部</Text>
          </TouchableOpacity>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: selectedCategory === cat.id ? Colors.primary : '#f3f4f6',
              }}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={{ fontSize: 12 }}>{cat.icon}</Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: selectedCategory === cat.id ? '#fff' : colors.text.secondary }}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* View type filter */}
      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6, gap: 6 }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
              backgroundColor: selectedViewType === 'all' ? '#eff6ff' : '#f9fafb',
            }}
            onPress={() => setSelectedViewType('all')}
          >
            <Text style={{ fontSize: 12, color: selectedViewType === 'all' ? '#3b82f6' : colors.text.muted }}>全部类型</Text>
          </TouchableOpacity>
          {['list', 'board', 'calendar', 'table', 'timeline', 'gallery'].map((type) => (
            <TouchableOpacity
              key={type}
              style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: selectedViewType === type ? '#eff6ff' : '#f9fafb',
              }}
              onPress={() => setSelectedViewType(type)}
            >
              <Text style={{ fontSize: 11 }}>{getViewTypeIcon(type)}</Text>
              <Text style={{ fontSize: 12, color: selectedViewType === type ? '#3b82f6' : colors.text.muted }}>{getViewTypeLabel(type)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Results count */}
        <Text style={{ fontSize: 12, color: colors.text.muted, marginBottom: 12 }}>
          找到 {filteredTemplates.length} 个模板
        </Text>

        {/* Recommended section */}
        {selectedCategory === 'all' && !searchQuery && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>⭐ 推荐模板</Text>
            {recommended.map((t) => renderTemplateCard(t, true))}
          </View>
        )}

        {/* All templates */}
        {selectedCategory !== 'all' && (
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>
            {TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory)?.icon}{' '}
            {TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory)?.name} 模板
          </Text>
        )}

        {filteredTemplates.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
            <Text style={{ color: colors.text.muted, fontSize: 14 }}>没有找到匹配的模板</Text>
            <TouchableOpacity
              style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.background.tertiary, borderRadius: 8 }}
              onPress={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedViewType('all'); }}
            >
              <Text style={{ color: colors.text.secondary, fontSize: 13 }}>清除筛选</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTemplates
            .filter((t) => !recommended.some((r) => r.id === t.id) || selectedCategory !== 'all' || searchQuery)
            .map((t) => renderTemplateCard(t))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
