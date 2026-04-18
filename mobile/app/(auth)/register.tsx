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

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const inputStyle = (field: string) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: focusedField === field ? Colors.primary : '#e5e7eb',
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f0ff' }}>
      <View style={{ position: 'absolute', top: -80, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(59,130,246,0.1)' }} />
      <View style={{ position: 'absolute', bottom: -80, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(139,92,246,0.12)' }} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 22,
              backgroundColor: Colors.primary,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
              marginBottom: 16,
            }}>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>+</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#1e1b4b', marginBottom: 6 }}>创建账号</Text>
            <Text style={{ fontSize: 15, color: '#6b7280' }}>开始管理你的待办事项</Text>
          </View>

          {/* Form card */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 24, padding: 24,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08, shadowRadius: 20, elevation: 8,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
          }}>
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
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>用户名</Text>
              <View style={inputStyle('username')}>
                <Text style={{ fontSize: 16, color: focusedField === 'username' ? Colors.primary : '#9ca3af', marginRight: 10 }}>👤</Text>
                <TextInput
                  style={{ flex: 1, paddingVertical: 13, fontSize: 16, color: '#111827' }}
                  placeholder="输入用户名"
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>邮箱</Text>
              <View style={inputStyle('email')}>
                <Text style={{ fontSize: 16, color: focusedField === 'email' ? Colors.primary : '#9ca3af', marginRight: 10 }}>📧</Text>
                <TextInput
                  style={{ flex: 1, paddingVertical: 13, fontSize: 16, color: '#111827' }}
                  placeholder="输入邮箱"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>密码</Text>
              <View style={inputStyle('password')}>
                <Text style={{ fontSize: 16, color: focusedField === 'password' ? Colors.primary : '#9ca3af', marginRight: 10 }}>🔒</Text>
                <TextInput
                  style={{ flex: 1, paddingVertical: 13, fontSize: 16, color: '#111827' }}
                  placeholder="输入密码（至少8位）"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Confirm password */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>确认密码</Text>
              <View style={inputStyle('confirm')}>
                <Text style={{ fontSize: 16, color: focusedField === 'confirm' ? Colors.primary : '#9ca3af', marginRight: 10 }}>🔒</Text>
                <TextInput
                  style={{ flex: 1, paddingVertical: 13, fontSize: 16, color: '#111827' }}
                  placeholder="再次输入密码"
                  placeholderTextColor="#9ca3af"
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
              </View>
            </View>

            {/* Register button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={{
                backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16,
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
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>注册中...</Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 18 }}>✨</Text>
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>创建账号</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <Text style={{ color: '#6b7280', fontSize: 14 }}>已有账号？</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '600' }}>立即登录</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
