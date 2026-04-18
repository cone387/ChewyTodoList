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

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('请填写所有必填字段');
      return;
    }
    if (password !== passwordConfirm) {
      setError('两次输入的密码不一致');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(username.trim(), password, email.trim());
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.error?.message ||
        data?.message ||
        (typeof data === 'object' ? JSON.stringify(data) : '注册失败，请重试');
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
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl bg-purple-500 items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">C</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">创建账号</Text>
            <Text className="text-gray-500 mt-1">开始管理你的待办事项</Text>
          </View>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

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
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">邮箱</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
                placeholder="请输入邮箱"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">密码</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
                placeholder="请输入密码（至少8位）"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">确认密码</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
                placeholder="请再次输入密码"
                placeholderTextColor="#9ca3af"
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center mt-2 ${loading ? 'bg-purple-300' : 'bg-purple-500'}`}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">注册</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">已有账号？</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-purple-600 font-medium"> 立即登录</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
