import type { Task } from '../types/index';
import { TaskStatus, TaskPriority } from '../types/index';

// 生成模拟任务数据用于模板预览
export const generateMockTasks = (count: number = 20): Task[] => {
  const projects = [
    { 
      uid: 'proj-1', 
      name: '产品开发', 
      desc: '产品相关开发任务',
      group: { uid: 'g1', name: '工作', desc: '', sort_order: 1, settings: {}, created_at: '', updated_at: '', projects_count: 0 },
      view_type: 'list' as const,
      style: {},
      settings: {},
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks_count: 0,
      completed_tasks_count: 0,
    },
    { 
      uid: 'proj-2', 
      name: '市场营销', 
      desc: '市场推广相关任务',
      group: { uid: 'g1', name: '工作', desc: '', sort_order: 1, settings: {}, created_at: '', updated_at: '', projects_count: 0 },
      view_type: 'list' as const,
      style: {},
      settings: {},
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks_count: 0,
      completed_tasks_count: 0,
    },
    { 
      uid: 'proj-3', 
      name: '个人成长', 
      desc: '个人学习和成长',
      group: { uid: 'g2', name: '个人', desc: '', sort_order: 2, settings: {}, created_at: '', updated_at: '', projects_count: 0 },
      view_type: 'list' as const,
      style: {},
      settings: {},
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks_count: 0,
      completed_tasks_count: 0,
    },
  ];

  const tags = [
    { uid: 'tag-1', name: '紧急', color: '#ef4444', sort_order: 1, created_at: '', updated_at: '' },
    { uid: 'tag-2', name: '重要', color: '#f59e0b', sort_order: 2, created_at: '', updated_at: '' },
    { uid: 'tag-3', name: '设计', color: '#8b5cf6', sort_order: 3, created_at: '', updated_at: '' },
    { uid: 'tag-4', name: '开发', color: '#3b82f6', sort_order: 4, created_at: '', updated_at: '' },
    { uid: 'tag-5', name: '会议', color: '#10b981', sort_order: 5, created_at: '', updated_at: '' },
    { uid: 'tag-6', name: '文档', color: '#6366f1', sort_order: 6, created_at: '', updated_at: '' },
  ];

  const taskTitles = [
    '完成产品需求文档',
    '设计新功能界面',
    '修复登录页面bug',
    '准备周会演示材料',
    '优化数据库查询性能',
    '编写API文档',
    '用户访谈和调研',
    '更新项目进度报告',
    '代码审查和重构',
    '测试新功能模块',
    '制定下季度OKR',
    '学习新技术框架',
    '整理项目文档',
    '客户需求沟通',
    '系统性能优化',
    '团队建设活动策划',
    '竞品分析报告',
    'UI/UX设计评审',
    '部署生产环境',
    '数据备份和恢复测试',
  ];

  const taskContents = [
    '需要详细梳理产品功能点和用户故事',
    '参考最新的设计趋势，注重用户体验',
    '检查表单验证逻辑，确保数据安全',
    '准备演示demo和PPT材料',
    '分析慢查询日志，优化索引',
    '使用Swagger生成API文档',
    '收集用户反馈，改进产品',
    '更新项目看板和里程碑',
    '重构冗余代码，提高可维护性',
    '编写单元测试和集成测试',
    '与团队讨论目标和关键结果',
    '学习React 19新特性',
    '整理技术文档和知识库',
    '了解客户业务需求和痛点',
    '优化前端资源加载速度',
    '组织团队团建活动',
    '分析竞争对手的产品特性',
    '评审设计稿，提出改进建议',
    '配置CI/CD流程',
    '测试备份恢复流程',
  ];

  const statuses = [TaskStatus.TODO, TaskStatus.TODO, TaskStatus.TODO, TaskStatus.COMPLETED, TaskStatus.UNASSIGNED];
  const priorities = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT];

  const now = new Date();
  const tasks: Task[] = [];

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const project = projects[Math.floor(Math.random() * projects.length)];
    
    // 随机选择1-3个标签
    const taskTagCount = Math.floor(Math.random() * 3) + 1;
    const taskTags = [];
    const usedTagIndices = new Set<number>();
    for (let j = 0; j < taskTagCount; j++) {
      let tagIndex;
      do {
        tagIndex = Math.floor(Math.random() * tags.length);
      } while (usedTagIndices.has(tagIndex));
      usedTagIndices.add(tagIndex);
      taskTags.push(tags[tagIndex]);
    }

    // 生成随机日期（过去7天到未来14天）
    const daysOffset = Math.floor(Math.random() * 21) - 7;
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + daysOffset);

    const startDate = new Date(dueDate);
    startDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 7));

    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - Math.floor(Math.random() * 30));

    const isCompleted = status === TaskStatus.COMPLETED;
    const completedTime = isCompleted ? new Date(now).toISOString() : undefined;

    // 随机子任务
    const subtasksCount = Math.floor(Math.random() * 5);
    const completedSubtasksCount = isCompleted ? subtasksCount : Math.floor(Math.random() * subtasksCount);

    const task: Task = {
      uid: `task-${i + 1}`,
      title: taskTitles[i % taskTitles.length],
      content: taskContents[i % taskContents.length],
      status,
      status_display: status === TaskStatus.TODO ? '待办' :
                      status === TaskStatus.COMPLETED ? '已完成' :
                      status === TaskStatus.UNASSIGNED ? '未分配' : '已放弃',
      priority,
      priority_display: priority === TaskPriority.LOW ? '低' :
                        priority === TaskPriority.MEDIUM ? '中' :
                        priority === TaskPriority.HIGH ? '高' : '紧急',
      project,
      tags: taskTags,
      is_all_day: false,
      start_date: startDate.toISOString(),
      due_date: dueDate.toISOString(),
      completed_time: completedTime,
      time_zone: 'Asia/Shanghai',
      sort_order: i,
      attachments: [],
      created_at: createdAt.toISOString(),
      updated_at: new Date().toISOString(),
      is_completed: isCompleted,
      is_overdue: !isCompleted && dueDate < now,
      subtasks_count: subtasksCount,
      completed_subtasks_count: completedSubtasksCount,
    };

    tasks.push(task);
  }

  return tasks;
};

// 根据模板筛选条件过滤任务
export const filterTasksByTemplate = (tasks: Task[], filters: any[]): Task[] => {
  if (!filters || filters.length === 0) return tasks;

  return tasks.filter(task => {
    return filters.every(filter => {
      const { field, operator, value } = filter;

      switch (field) {
        case 'status':
          if (operator === 'equals') return task.status === value;
          if (operator === 'not_equals') return task.status !== value;
          if (operator === 'in') return value.includes(task.status);
          break;

        case 'priority':
          if (operator === 'equals') return task.priority === value;
          if (operator === 'in') return value.includes(task.priority);
          if (operator === 'greater_than') return task.priority > value;
          break;

        case 'due_date':
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const taskDate = task.due_date ? new Date(task.due_date) : null;
          
          if (!taskDate && operator !== 'has_no_date') return false;
          
          if (operator === 'is_today') {
            const taskDay = new Date(taskDate!.getFullYear(), taskDate!.getMonth(), taskDate!.getDate());
            return taskDay.getTime() === today.getTime();
          }
          if (operator === 'is_this_week') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay() + 1);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return taskDate! >= weekStart && taskDate! <= weekEnd;
          }
          if (operator === 'is_overdue') {
            return !task.is_completed && taskDate! < now;
          }
          if (operator === 'has_no_date') {
            return !task.due_date;
          }
          if (operator === 'is_not_empty') {
            return !!task.due_date;
          }
          break;

        case 'tags':
          if (operator === 'contains') {
            return task.tags.some(tag => tag.name.includes(value));
          }
          break;

        default:
          return true;
      }

      return true;
    });
  });
};

// 根据模板排序规则排序任务
export const sortTasksByTemplate = (tasks: Task[], sorts: any[]): Task[] => {
  if (!sorts || sorts.length === 0) return tasks;

  return [...tasks].sort((a, b) => {
    for (const sort of sorts) {
      const { field, direction } = sort;
      let comparison = 0;

      switch (field) {
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'due_date':
          const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
          const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'sort_order':
          comparison = a.sort_order - b.sort_order;
          break;
      }

      if (comparison !== 0) {
        return direction === 'asc' ? comparison : -comparison;
      }
    }

    return 0;
  });
};