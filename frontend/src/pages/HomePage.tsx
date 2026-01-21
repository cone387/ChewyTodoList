import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import TaskList from '../components/TaskList';
import BottomNav from '../components/BottomNav';
import FloatingAddButton from '../components/FloatingAddButton';

const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const projectFilter = searchParams.get('project');

  useEffect(() => {
    // 如果有项目筛选参数，可以在这里处理
    if (projectFilter) {
      console.log('Filtering by project:', projectFilter);
    }
  }, [projectFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = () => {
    // TODO: 实现筛选功能
    console.log('Filter clicked');
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden">
      <Header onSearch={handleSearch} onFilter={handleFilter} />
      <TaskList />
      <FloatingAddButton />
      <BottomNav />
    </div>
  );
};

export default HomePage;