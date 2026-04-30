import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../../shared/services/api';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';
import type { ActivityLog } from '../../shared/types/index';

const ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  created: { icon: 'plus-circle', color: colors.text.secondary, bg: '#f3f4f6' },
  updated: { icon: 'pencil', color: '#3b82f6', bg: '#eff6ff' },
  status_changed: { icon: 'swap-horizontal', color: '#8b5cf6', bg: '#f3f0ff' },
  completed: { icon: 'check-circle', color: '#22c55e', bg: '#f0fdf4' },
  deleted: { icon: 'delete', color: colors.error, bg: '#fef2f2' },
};

function fmtTime(s: string): string {
  const d = new Date(s);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}小时前`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export default function ActivityLogPage() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ uid: string }>();
  const uid = params.uid;

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', { task: uid }],
    queryFn: async () => {
      const res = await activityApi.getActivityLogs({ task: uid });
      return res.data.data.results || [];
    },
    enabled: !!uid,
  });

  const logs: ActivityLog[] = data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>活动日志</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="history" size={48} color="#d1d5db" />
              <Text style={{ color: colors.text.muted, fontSize: 14, marginTop: 12 }}>暂无活动记录</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const info = ICONS[item.action] || ICONS.updated;
            return (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                {/* Timeline */}
                <View style={{ alignItems: 'center', width: 32 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: info.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={info.icon as any} size={16} color={info.color} />
                  </View>
                  {index < logs.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: '#e5e7eb', marginTop: 4 }} />}
                </View>
                {/* Content */}
                <View style={{ flex: 1, paddingTop: 4 }}>
                  <Text style={{ fontSize: 14, color: colors.text.secondary, fontWeight: '500' }}>{item.action_display}</Text>
                  {item.detail ? <Text style={{ fontSize: 13, color: colors.text.secondary, marginTop: 2 }}>{item.detail}</Text> : null}
                  <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 4 }}>{fmtTime(item.created_at)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
