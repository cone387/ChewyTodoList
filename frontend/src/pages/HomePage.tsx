import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import TaskList from '../components/TaskList';
import BottomNav from '../components/BottomNav';
import FloatingAddButton from '../components/FloatingAddButton';

const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get('project');

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

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden">
      <Header onSearch={handleSearch} onFilter={handleFilter} />
      <main className="flex-1 overflow-y-auto pb-16 bg-white dark:bg-background-dark">
        <TaskList />
      </main>
      <FloatingAddButton />
      <BottomNav />
    </div>
  );
};

export default HomePage;