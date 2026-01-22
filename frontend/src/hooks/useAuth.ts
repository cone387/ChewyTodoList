import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// 登录
export const useLogin = () => {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      const { access, refresh } = response.data.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      navigate('/');
    },
  });
};

// 注册
export const useRegister = () => {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      const { access, refresh } = response.data.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      navigate('/');
    },
  });
};

// 登出
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      // 即使登出失败也清除本地token
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      queryClient.clear();
      navigate('/login');
    },
  });
};

// 获取用户信息
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    select: (data) => data.data,
    retry: (failureCount, error: any) => {
      // 如果是401错误，不要重试
      if (error?.response?.status === 401) {
        return false;
      }
      // 其他错误最多重试2次
      return failureCount < 2;
    },
    enabled: !!localStorage.getItem('access_token'),
  });
};

// 检查是否已登录
export const useIsAuthenticated = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('access_token');
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      setIsAuthenticated(!!token);
    };

    // 监听storage变化
    window.addEventListener('storage', checkAuth);
    
    // 定期检查（防止token在其他标签页被清除）
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  return isAuthenticated;
};

// 认证守卫Hook
export const useAuthGuard = () => {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (!isAuthenticated && window.location.pathname !== '/login') {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated;
};