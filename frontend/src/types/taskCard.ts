// 任务卡片模板类型定义

export interface TaskCardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  preview: string; // 预览图URL或描述
  style: {
    // 卡片整体样式
    layout: 'compact' | 'comfortable' | 'spacious';
    borderRadius: 'none' | 'small' | 'medium' | 'large';
    shadow: 'none' | 'small' | 'medium' | 'large';
    padding: 'tight' | 'normal' | 'loose';
    
    // 标题样式
    titleSize: 'small' | 'medium' | 'large';
    titleWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    showStrikethrough: boolean;
    
    // 元数据显示
    showProject: boolean;
    showTags: boolean;
    showDueDate: boolean;
    showPriority: boolean;
    showStatus: boolean;
    showSubtasks: boolean;
    showDescription: boolean;
    
    // 元数据样式
    metadataLayout: 'inline' | 'stacked' | 'grid';
    tagStyle: 'pill' | 'badge' | 'minimal';
    iconStyle: 'outlined' | 'filled' | 'rounded';
    
    // 颜色和主题
    priorityIndicator: 'flag' | 'border' | 'background' | 'dot' | 'none';
    statusIndicator: 'badge' | 'border' | 'icon' | 'none';
    
    // 交互
    hoverEffect: 'lift' | 'glow' | 'border' | 'none';
    checkboxStyle: 'circle' | 'square' | 'rounded';
  };
}

export const TASK_CARD_TEMPLATES: TaskCardTemplate[] = [
  {
    id: 'default',
    name: '默认卡片',
    description: '简洁实用的默认样式',
    icon: 'article',
    preview: '标准的任务卡片，显示所有关键信息',
    style: {
      layout: 'comfortable',
      borderRadius: 'medium',
      shadow: 'small',
      padding: 'normal',
      titleSize: 'medium',
      titleWeight: 'medium',
      showStrikethrough: true,
      showProject: true,
      showTags: true,
      showDueDate: true,
      showPriority: true,
      showStatus: true,
      showSubtasks: true,
      showDescription: false,
      metadataLayout: 'inline',
      tagStyle: 'pill',
      iconStyle: 'outlined',
      priorityIndicator: 'flag',
      statusIndicator: 'badge',
      hoverEffect: 'lift',
      checkboxStyle: 'rounded',
    },
  },
  {
    id: 'minimal',
    name: '极简卡片',
    description: '最小化信息，专注任务本身',
    icon: 'minimize',
    preview: '只显示任务标题和完成状态',
    style: {
      layout: 'compact',
      borderRadius: 'small',
      shadow: 'none',
      padding: 'tight',
      titleSize: 'small',
      titleWeight: 'normal',
      showStrikethrough: true,
      showProject: false,
      showTags: false,
      showDueDate: true,
      showPriority: false,
      showStatus: false,
      showSubtasks: false,
      showDescription: false,
      metadataLayout: 'inline',
      tagStyle: 'minimal',
      iconStyle: 'outlined',
      priorityIndicator: 'dot',
      statusIndicator: 'none',
      hoverEffect: 'border',
      checkboxStyle: 'circle',
    },
  },
  {
    id: 'detailed',
    name: '详细卡片',
    description: '显示完整的任务信息',
    icon: 'description',
    preview: '包含描述、标签、项目等所有信息',
    style: {
      layout: 'spacious',
      borderRadius: 'large',
      shadow: 'medium',
      padding: 'loose',
      titleSize: 'large',
      titleWeight: 'semibold',
      showStrikethrough: true,
      showProject: true,
      showTags: true,
      showDueDate: true,
      showPriority: true,
      showStatus: true,
      showSubtasks: true,
      showDescription: true,
      metadataLayout: 'stacked',
      tagStyle: 'badge',
      iconStyle: 'filled',
      priorityIndicator: 'border',
      statusIndicator: 'badge',
      hoverEffect: 'glow',
      checkboxStyle: 'rounded',
    },
  },
  {
    id: 'kanban',
    name: '看板卡片',
    description: '适合看板视图的紧凑样式',
    icon: 'view_kanban',
    preview: '紧凑布局，适合看板列显示',
    style: {
      layout: 'compact',
      borderRadius: 'medium',
      shadow: 'small',
      padding: 'normal',
      titleSize: 'small',
      titleWeight: 'medium',
      showStrikethrough: false,
      showProject: false,
      showTags: true,
      showDueDate: true,
      showPriority: true,
      showStatus: false,
      showSubtasks: true,
      showDescription: false,
      metadataLayout: 'stacked',
      tagStyle: 'pill',
      iconStyle: 'outlined',
      priorityIndicator: 'flag',
      statusIndicator: 'none',
      hoverEffect: 'lift',
      checkboxStyle: 'square',
    },
  },
  {
    id: 'colorful',
    name: '彩色卡片',
    description: '使用颜色突出优先级和状态',
    icon: 'palette',
    preview: '彩色边框和背景，视觉冲击力强',
    style: {
      layout: 'comfortable',
      borderRadius: 'large',
      shadow: 'medium',
      padding: 'normal',
      titleSize: 'medium',
      titleWeight: 'semibold',
      showStrikethrough: true,
      showProject: true,
      showTags: true,
      showDueDate: true,
      showPriority: true,
      showStatus: true,
      showSubtasks: true,
      showDescription: false,
      metadataLayout: 'inline',
      tagStyle: 'badge',
      iconStyle: 'filled',
      priorityIndicator: 'background',
      statusIndicator: 'border',
      hoverEffect: 'glow',
      checkboxStyle: 'rounded',
    },
  },
  {
    id: 'timeline',
    name: '时间线卡片',
    description: '强调时间信息的卡片样式',
    icon: 'timeline',
    preview: '突出显示截止日期和时间信息',
    style: {
      layout: 'comfortable',
      borderRadius: 'medium',
      shadow: 'small',
      padding: 'normal',
      titleSize: 'medium',
      titleWeight: 'medium',
      showStrikethrough: true,
      showProject: true,
      showTags: false,
      showDueDate: true,
      showPriority: true,
      showStatus: true,
      showSubtasks: true,
      showDescription: false,
      metadataLayout: 'inline',
      tagStyle: 'minimal',
      iconStyle: 'outlined',
      priorityIndicator: 'dot',
      statusIndicator: 'icon',
      hoverEffect: 'border',
      checkboxStyle: 'circle',
    },
  },
];
