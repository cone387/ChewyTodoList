/**
 * TaskCard — 配置驱动的任务卡片组件
 * 根据 TaskCardConfig.field_configs 动态渲染字段
 * 如果没有 card_config，使用默认布局
 */
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import type { Task, TaskCardConfig, CardFieldConfig } from '../../shared/types/index';
import { TaskStatus } from '../../shared/types/index';
import { FieldRenderer, groupFieldsByPosition } from './TaskCardRenderer';
import { useTheme } from '../../hooks/useTheme';
import { CardLayout, Shadows } from '../../constants/theme';

// 默认字段配置（当视图没有绑定 card_config 时使用）
export const DEFAULT_FIELD_CONFIGS: CardFieldConfig[] = [
  { field: 'priority', visible: true, position: 'header_right', style: { variant: 'flag' } },
  { field: 'title', visible: true, position: 'header', style: { fontSize: 'medium', fontWeight: 'medium', showStrikethrough: true } },
  { field: 'tags', visible: true, position: 'body', style: { variant: 'pill', maxCount: 3 } },
  { field: 'project', visible: true, position: 'footer', style: {} },
  { field: 'due_date', visible: true, position: 'footer', style: { showRelative: true } },
  { field: 'subtasks_count', visible: true, position: 'footer', style: { showProgress: true } },
];

interface TaskCardProps {
  task: Task;
  cardConfig?: TaskCardConfig | null;
  onPress?: () => void;
  style?: object;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, cardConfig, onPress, style }) => {
  const { colors } = useTheme();
  const fieldConfigs = cardConfig?.field_configs?.length
    ? cardConfig.field_configs
    : DEFAULT_FIELD_CONFIGS;

  const layout = cardConfig?.layout || 'comfortable';
  const spacing = CardLayout[layout] || CardLayout.comfortable;
  const isCompleted = task.status === TaskStatus.COMPLETED;

  const groups = groupFieldsByPosition(fieldConfigs);

  const cardStyle = cardConfig?.style || {};
  const borderRadius = { none: 0, small: 6, medium: 10, large: 14 }[cardStyle.borderRadius as string] || 10;
  const shadow = cardStyle.shadow !== 'none';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius,
          padding: spacing.padding,
          marginHorizontal: 16,
          marginVertical: 4,
          opacity: isCompleted ? 0.7 : 1,
          ...(shadow ? Shadows.low : {}),
        },
        style,
      ]}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.gap }}>
        {/* header_left */}
        {groups.header_left.map((fc) => (
          <FieldRenderer key={fc.field} field={fc.field} task={task} fieldStyle={fc.style} />
        ))}

        {/* header (title) — flex: 1 */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.gap }}>
          {groups.header.map((fc) => (
            <FieldRenderer key={fc.field} field={fc.field} task={task} fieldStyle={fc.style} />
          ))}
        </View>

        {/* header_right */}
        {groups.header_right.map((fc) => (
          <FieldRenderer key={fc.field} field={fc.field} task={task} fieldStyle={fc.style} />
        ))}
      </View>

      {/* Body */}
      {groups.body.length > 0 && (
        <View style={{ marginTop: spacing.gap, gap: spacing.gap }}>
          {groups.body.map((fc) => (
            <FieldRenderer key={fc.field} field={fc.field} task={task} fieldStyle={fc.style} />
          ))}
        </View>
      )}

      {/* Footer */}
      {groups.footer.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: spacing.gap, gap: spacing.gap }}>
          {groups.footer.map((fc) => (
            <FieldRenderer key={fc.field} field={fc.field} task={task} fieldStyle={fc.style} />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};
