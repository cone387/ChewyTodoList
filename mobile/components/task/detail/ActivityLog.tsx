import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { activityApi } from '../../../shared/services/api';
import { Colors } from '../../../constants/theme';
import type { ActivityLog as ActivityLogType } from '../../../shared/types/index';

interface ActivityLogProps {
  taskUid: string;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  created: { icon: '➕', color: '#6b7280' },
  updated: { icon: '✏️', color: '#3b82f6' },
  status_changed: { icon: '🔄', color: '#8b5cf6' },
  completed: { icon: '✅', color: '#22c55e' },
  deleted: { icon: '🗑', color: '#ef4444' },
};

export const ActivityLog: React.FC<ActivityLogProps> = ({ taskUid }) => {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<ActivityLogType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (!loaded) {
      setLoading(true);
      try {
        const res = await activityApi.getActivityLogs({ task: taskUid });
        setLogs(res.data.data.results || []);
        setLoaded(true);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={{ backgroundColor: '#fff', marginTop: 8 }}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
        onPress={handleExpand}
      >
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' }}>活动日志</Text>
        <Text style={{ color: '#9ca3af', fontSize: 14 }}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ paddingVertical: 12 }} />
          ) : logs.length === 0 ? (
            <Text style={{ color: '#d1d5db', fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>暂无活动记录</Text>
          ) : (
            <View>
              {logs.map((log, idx) => {
                const actionInfo = ACTION_ICONS[log.action] || ACTION_ICONS.updated;
                return (
                  <View key={log.id} style={{ flexDirection: 'row', gap: 10, marginBottom: idx < logs.length - 1 ? 12 : 0 }}>
                    {/* Timeline dot + line */}
                    <View style={{ alignItems: 'center', width: 24 }}>
                      <Text style={{ fontSize: 14 }}>{actionInfo.icon}</Text>
                      {idx < logs.length - 1 && (
                        <View style={{ width: 1, flex: 1, backgroundColor: '#e5e7eb', marginTop: 4 }} />
                      )}
                    </View>
                    {/* Content */}
                    <View style={{ flex: 1, paddingBottom: 4 }}>
                      <Text style={{ fontSize: 13, color: '#374151' }}>{log.action_display}</Text>
                      {log.detail && (
                        <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{log.detail}</Text>
                      )}
                      <Text style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>{formatTime(log.created_at)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
};
