import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIsAuthenticated } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TaskDetailPage from './pages/TaskDetailPage';
import CreateTaskPage from './pages/CreateTaskPage';
import ProjectsPage from './pages/ProjectsPage';
import ViewsPage from './pages/ViewsPage';
import ViewPreviewPage from './pages/ViewPreviewPage';
import CreateViewPage from './pages/CreateViewPage';
import ViewTemplateMarketPage from './pages/ViewTemplateMarketPage';
import ViewTemplatePreviewPage from './pages/ViewTemplatePreviewPage';
import './index.css';

// 创建QueryClient实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// 公开路由组件（已登录用户重定向到首页）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="bg-background-light dark:bg-background-dark font-display text-[#111418] dark:text-white overflow-x-hidden">
        <Routes>
          {/* 公开路由 */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          
          {/* 受保护的路由 */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/task/:uid" 
            element={
              <ProtectedRoute>
                <TaskDetailPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/create" 
            element={
              <ProtectedRoute>
                <CreateTaskPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/views/templates" 
            element={
              <ProtectedRoute>
                <ViewTemplateMarketPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/views/template-preview" 
            element={
              <ProtectedRoute>
                <ViewTemplatePreviewPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/views/create" 
            element={
              <ProtectedRoute>
                <CreateViewPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/views/edit/:uid" 
            element={
              <ProtectedRoute>
                <CreateViewPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/views/:uid" 
            element={
              <ProtectedRoute>
                <ViewPreviewPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/views" 
            element={
              <ProtectedRoute>
                <ViewsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* 其他路由重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
