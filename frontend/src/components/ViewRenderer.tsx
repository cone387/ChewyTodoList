import React from 'react';
import type { Task, TaskView } from '../types/index';
import type { TaskCardTemplate } from '../types/taskCard';
import EnhancedTaskList from './EnhancedTaskList';
import KanbanBoard from './KanbanBoard';
import CalendarView from './CalendarView';
import TableView from './TableView';
import TimelineView from './TimelineView';
import GalleryView from './GalleryView';

interface ViewRendererProps {
  view: TaskView;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (task: Task, updates: Partial<Task>) => void;
  loading?: boolean;
  showCompleted?: boolean;
  cardStyle?: TaskCardTemplate;
}

const ViewRenderer: React.FC<ViewRendererProps> = ({
  view,
  tasks,
  onTaskClick,
  onTaskUpdate,
  loading = false,
  showCompleted = false,
  cardStyle,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  switch (view.view_type) {
    case 'list':
      return (
        <EnhancedTaskList
          tasks={tasks}
          view={view}
          onTaskClick={onTaskClick}
          onTaskUpdate={onTaskUpdate}
          showCompleted={showCompleted}
          cardStyle={cardStyle}
        />
      );
    
    case 'board':
      return (
        <KanbanBoard
          tasks={tasks}
          view={view}
          onTaskClick={onTaskClick}
        />
      );
    
    case 'calendar':
      return (
        <CalendarView
          tasks={tasks}
          view={view}
          onTaskClick={onTaskClick}
        />
      );
    
    case 'table':
      return (
        <TableView
          tasks={tasks}
          view={view}
          onTaskClick={onTaskClick}
          onTaskUpdate={onTaskUpdate}
        />
      );
    
    case 'timeline':
      return (
        <TimelineView
          tasks={tasks}
          view={view}
          onTaskClick={onTaskClick}
        />
      );
    
    case 'gallery':
      return (
        <GalleryView
          tasks={tasks}
          view={view}
          onTaskClick={onTaskClick}
        />
      );
    
    default:
      return (
        <EnhancedTaskList
          tasks={tasks}
          view={view}
          onTaskClick={onTaskClick}
          onTaskUpdate={onTaskUpdate}
          showCompleted={showCompleted}
          cardStyle={cardStyle}
        />
      );
  }
};

export default ViewRenderer;