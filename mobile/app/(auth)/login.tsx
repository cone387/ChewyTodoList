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
import { Colors } from '../../constants/theme';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
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

  const handleQuickLogin = () => {
    setUsername('demo');
    setPassword('demo123456');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f0ff' }}>
      {/* Background decorations */}
      <View style={{ position: 'absolute', top: -80, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(139,92,246,0.12)' }} />
      <View style={{ position: 'absolute', bottom: -80, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(59,130,246,0.1)' }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 22,
              backgroundColor: Colors.primary,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
              marginBottom: 16,
            }}>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>✓</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#1e1b4b', marginBottom: 6 }}>
              欢迎回来
            </Text>
            <Text style={{ fontSize: 15, color: '#6b7280' }}>
              继续您的高效之旅
            </Text>
          </View>

          {/* Form card */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: 24,
            padding: 24,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08, shadowRadius: 20, elevation: 8,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
          }}>
            {/* Error */}
            {error ? (
              <View style={{
                backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
                borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <Text style={{ color: '#ef4444', fontSize: 16 }}>⚠</Text>
                <Text style={{ color: '#dc2626', fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            {/* Username */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>用户名</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 2, borderColor: focusedField === 'username' ? Colors.primary : '#e5e7eb',
                borderRadius: 16, backgroundColor: '#f9fafb',
                paddingHorizontal: 14,
              }}>
                <Text style={{ fontSize: 18, color: focusedField === 'username' ? Colors.primary : '#9ca3af', marginRight: 10 }}>👤</Text>
                <TextInput
                  style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: '#111827' }}
                  placeholder="输入用户名"
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>密码</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 2, borderColor: focusedField === 'password' ? Colors.primary : '#e5e7eb',
                borderRadius: 16, backgroundColor: '#f9fafb',
                paddingHorizontal: 14,
              }}>
                <Text style={{ fontSize: 18, color: focusedField === 'password' ? Colors.primary : '#9ca3af', marginRight: 10 }}>🔒</Text>
                <TextInput
                  style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: '#111827' }}
                  placeholder="输入密码"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 16, color: '#9ca3af' }}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick login hint */}
            <View style={{
              backgroundColor: '#eff6ff', borderRadius: 16, padding: 14,
              borderWidth: 1, borderColor: '#bfdbfe50',
              flexDirection: 'row', alignItems: 'center', marginBottom: 20,
            }}>
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginRight: 10,
              }}>
                <Text style={{ color: '#fff', fontSize: 14 }}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1d4ed8' }}>演示账户</Text>
                <Text style={{ fontSize: 11, color: '#3b82f6' }}>快速体验应用功能</Text>
              </View>
              <TouchableOpacity
                onPress={handleQuickLogin}
                style={{
                  backgroundColor: '#3b82f6', borderRadius: 10,
                  paddingHorizontal: 14, paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>一键填入</Text>
              </TouchableOpacity>
            </View>

            {/* Login button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: Colors.primary,
                borderRadius: 16, paddingVertical: 16,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 8,
                shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>登录中...</Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 18 }}>→</Text>
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>立即登录</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db40' }} />
            <Text style={{ paddingHorizontal: 16, fontSize: 13, color: '#9ca3af' }}>或者</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db40' }} />
          </View>

          {/* Register link */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>还没有账户？</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: '#f3f4f6', borderRadius: 16,
                paddingHorizontal: 24, paddingVertical: 12,
              }}>
                <Text style={{ fontSize: 16 }}>👤</Text>
                <Text style={{ color: '#374151', fontSize: 15, fontWeight: '600' }}>创建新账户</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Footer */}
          <Text style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
            © 2026 ChewyTodo · 让效率成为习惯
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
