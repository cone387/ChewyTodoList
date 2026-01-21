import React, { useState } from 'react';
import { useLogin } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleQuickLogin = () => {
    setFormData({
      username: 'demo',
      password: 'demo123456',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="relative">
            <div className="size-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/25 transform hover:scale-105 transition-transform duration-300">
              <span className="material-symbols-outlined text-white text-[36px] fill-1">task_alt</span>
            </div>
            <div className="absolute -top-2 -right-2 size-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 dark:from-white dark:via-purple-200 dark:to-cyan-200 bg-clip-text text-transparent mb-3">
            欢迎回来
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            继续您的高效之旅
          </p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名输入 */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                用户名
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                  focusedField === 'username' ? 'text-purple-500' : 'text-gray-400'
                }`}>
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-0 focus:border-purple-500 dark:focus:border-purple-400 bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-lg"
                  placeholder="输入用户名"
                  required
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                密码
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                  focusedField === 'password' ? 'text-purple-500' : 'text-gray-400'
                }`}>
                  <span className="material-symbols-outlined text-[22px]">lock</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-14 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-0 focus:border-purple-500 dark:focus:border-purple-400 bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-lg"
                  placeholder="输入密码"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors duration-200 p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* 快速登录提示 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[16px] fill-1">flash_on</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">演示账户</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">快速体验应用功能</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickLogin}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  一键填入
                </button>
              </div>
            </div>

            {/* 错误信息 */}
            {login.error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500 text-[20px] fill-1">error</span>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {(login.error as any)?.response?.data?.error?.message || '登录失败，请检查用户名和密码'}
                  </p>
                </div>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {login.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px] fill-1">login</span>
                  <span>立即登录</span>
                </>
              )}
            </button>
          </form>

          {/* 分割线 */}
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400 font-medium">或者</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
          </div>

          {/* 注册链接 */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              还没有账户？
            </p>
            <Link 
              to="/register" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>创建新账户</span>
            </Link>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 待办事项管理 · 让效率成为习惯
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;