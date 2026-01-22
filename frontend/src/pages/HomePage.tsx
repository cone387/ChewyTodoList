import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import TaskList from '../components/TaskList';
import BottomNav from '../components/BottomNav';
import FloatingAddButton from '../components/FloatingAddButton';
import { useViewTasks, useNavViews } from '../hooks/useViews';

const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<string>('');
  const projectFilter = searchParams.get('project');

  const { data: navViews } = useNavViews();
  const { data: viewTasks } = useViewTasks(currentView);

  useEffect(() => {
    // 设置默认视图
    if (navViews?.results && navViews.results.length > 0 && !currentView) {
      const defaultView = navViews.results.find(v => v.is_default) || navViews.results[0];
      setCurrentView(defaultView.uid);
    }
  }, [navViews, currentView]);

  useEffect(() => {
    // 如果有项目筛选参数，可以在这里处理
    if (projectFilter) {
      console.log('Filtering by project:', projectFilter);
    }
  }, [projectFilter]);

  const handleSearch = (query: string) => {
    // TODO: 实现搜索功能
    console.log('Search query:', query);
  };

  const handleFilter = () => {
    // TODO: 实现筛选功能
    console.log('Filter clicked');
  };

  const handleViewChange = (viewUid: string) => {
    setCurrentView(viewUid);
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden">
      <Header 
        onSearch={handleSearch} 
        onFilter={handleFilter}
        onViewChange={handleViewChange}
        currentView={currentView}
      />
      <main className="flex-1 overflow-y-auto pb-16 bg-white dark:bg-background-dark">
        <TaskList viewTasks={viewTasks?.results} />
      </main>
      <FloatingAddButton />
      <BottomNav />
    </div>
  );
};

export default HomePage;