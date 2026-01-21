import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTasks, useToggleTaskStatus } from '../hooks/useTasks';
import type { Task } from '../types/index';
import { TaskStatus } from '../types/index';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onTaskClick: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onTaskClick }) => {
  const isCompleted = task.status === TaskStatus.COMPLETED;
  
  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = parseISO(dateString);
    return format(date, 'HH:mm');
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = parseISO(dateString);
    if (isToday(date)) return '今天';
    if (isTomorrow(date)) return '明天';
    return format(date, 'M月d日', { locale: zhCN });
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'text-red-500'; // URGENT
      case 2: return 'text-orange-500'; // HIGH
      case 1: return 'text-blue-500'; // MEDIUM
      default: return 'text-gray-400'; // LOW
    }
  };

  return (
    <div 
      className="group flex items-start gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={() => onTaskClick(task)}
    >
      <button 
        className={`mt-0.5 flex-shrink-0 transition-colors ${
          isCompleted 
            ? 'text-green-500' 
            : 'text-gray-400 hover:text-primary'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
      >
        <span className={`material-symbols-outlined text-[22px] ${isCompleted ? 'fill-1' : ''}`}>
          {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
        </span>
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`text-sm font-semibold leading-tight ${
            isCompleted 
              ? 'text-gray-400 dark:text-gray-500 line-through' 
              : 'text-[#111418] dark:text-white'
          }`}>
            {task.title}
          </h4>
          
          <div className="flex items-center gap-1 ml-2">
            {task.start_date && (
              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                {formatTime(task.start_date)}
              </span>
            )}
            {task.priority >= 2 && (
              <span className={`material-symbols-outlined text-[16px] fill-1 ${getPriorityColor(task.priority)}`}>
                flag
              </span>
            )}
          </div>
        </div>
        
        {task.content && (
          <p className={`text-xs mt-1 ${
            isCompleted 
              ? 'text-gray-400 dark:text-gray-500' 
              : 'text-gray-600 dark:text-gray-300'
          }`}>
            {task.content}
          </p>
        )}
        
        <div className={`flex flex-wrap items-center gap-2 mt-2 ${isCompleted ? 'opacity-60' : ''}`}>
          {/* 项目标签 */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[10px] font-medium">
            <span className="material-symbols-outlined text-[12px]">list_alt</span>
            <span>{task.project.name}</span>
          </div>
          
          {/* 标签 */}
          {task.tags.map((tag) => (
            <span 
              key={tag.uid}
              className="text-[10px] px-1.5 py-0.5 rounded border font-medium"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                borderColor: `${tag.color}40`,
              }}
            >
              #{tag.name}
            </span>
          ))}
          
          {/* 截止日期 */}
          {task.due_date && (
            <span className={`text-[11px] font-medium whitespace-nowrap ${
              task.is_overdue && !isCompleted
                ? 'text-red-500'
                : 'text-gray-500'
            }`}>
              截止 {formatDueDate(task.due_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  onToggleTask: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  showDot?: boolean;
}

const TaskSection: React.FC<TaskSectionProps> = ({ 
  title, 
  tasks, 
  onToggleTask, 
  onTaskClick,
  showDot = false 
}) => {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-2">
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-[#111418] dark:text-white text-sm font-bold flex items-center gap-2">
          {showDot && <span className="size-2 bg-primary rounded-full"></span>}
          {title}
        </h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {tasks.map((task) => (
          <TaskItem 
            key={task.uid} 
            task={task} 
            onToggle={onToggleTask}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
};

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get('project');
  
  const { data: tasksResponse, isLoading } = useTasks();
  const toggleTaskStatus = useToggleTaskStatus();

  const handleToggleTask = (task: Task) => {
    toggleTaskStatus.mutate(task);
  };

  const handleTaskClick = (task: Task) => {
    navigate(`/task/${task.uid}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  let tasks = tasksResponse?.results || [];
  
  // 如果有项目筛选，只显示该项目的任务
  if (projectFilter) {
    tasks = tasks.filter(task => task.project.uid === projectFilter);
  }
  
  // 按日期分组任务
  const groupTasksByDate = (tasks: Task[]) => {
    const today = new Date();
    const todayTasks: Task[] = [];
    const otherTasks: Task[] = [];

    tasks.forEach((task) => {
      if (task.due_date) {
        const dueDate = parseISO(task.due_date);
        if (isToday(dueDate)) {
          todayTasks.push(task);
        } else {
          otherTasks.push(task);
        }
      } else if (task.start_date) {
        const startDate = parseISO(task.start_date);
        if (isToday(startDate)) {
          todayTasks.push(task);
        } else {
          otherTasks.push(task);
        }
      } else {
        todayTasks.push(task); // 没有日期的任务放在今天
      }
    });

    return { todayTasks, otherTasks };
  };

  const { todayTasks, otherTasks } = groupTasksByDate(tasks);

  return (
    <main className="flex-1 overflow-y-auto pb-24 bg-white dark:bg-background-dark">
      {/* Project Filter Header */}
      {projectFilter && tasks.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">list_alt</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {tasks[0]?.project.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({tasks.length} 个任务)
            </span>
          </div>
        </div>
      )}
      
      <TaskSection
        title="今天"
        tasks={todayTasks}
        onToggleTask={handleToggleTask}
        onTaskClick={handleTaskClick}
        showDot={true}
      />
      
      {otherTasks.length > 0 && (
        <TaskSection
          title="其他"
          tasks={otherTasks}
          onToggleTask={handleToggleTask}
          onTaskClick={handleTaskClick}
        />
      )}
      
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="material-symbols-outlined text-[48px] mb-4">task_alt</span>
          <p className="text-sm">
            {projectFilter ? '该项目暂无任务' : '暂无任务'}
          </p>
        </div>
      )}
    </main>
  );
};

export default TaskList;