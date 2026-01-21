import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

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
    retry: false,
  });
};

// 检查是否已登录
export const useIsAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  return !!token;
};