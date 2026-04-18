import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      // useAuth 内部会 setIsAuthenticated(true)，根布局守卫会跳转
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        '登录失败，请检查用户名和密码';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo / 标题 */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl bg-purple-500 items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">C</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">ChewyTodo</Text>
            <Text className="text-gray-500 mt-1">登录你的账号</Text>
          </View>

          {/* 错误提示 */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* 表单 */}
          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">用户名</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
                placeholder="请输入用户名"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">密码</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
                placeholder="请输入密码"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center mt-2 ${loading ? 'bg-purple-300' : 'bg-purple-500'}`}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">登录</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 注册链接 */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">还没有账号？</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-purple-600 font-medium"> 立即注册</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
