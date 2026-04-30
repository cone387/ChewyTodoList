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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';

export default function RegisterPage() {
  const { register } = useAuth();
  const { colors, isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (loading) return;
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

  const inputWrapStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 14,
    height: 48,
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? colors.background.primary : '#f0f0ff' }}>
      <View style={{ position: 'absolute', top: -80, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)' }} />
      <View style={{ position: 'absolute', bottom: -80, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: isDark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.12)' }} />

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
              ...Platform.select({
                web: { boxShadow: `0px 8px 16px ${Colors.primary}59` },
                default: {
                  shadowColor: Colors.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  elevation: 12,
                },
              }),
              marginBottom: 16,
            }}>
              <MaterialCommunityIcons name="account-plus" size={36} color="#fff" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: isDark ? colors.text.primary : '#1e1b4b', marginBottom: 6 }}>创建账号</Text>
            <Text style={{ fontSize: 15, color: colors.text.secondary }}>开始管理你的待办事项</Text>
          </View>

          {/* Form card */}
          <View style={{
            backgroundColor: isDark ? colors.card : 'rgba(255,255,255,0.85)', borderRadius: 24, padding: 24,
            ...Platform.select({
              web: { boxShadow: isDark ? '0px 4px 20px rgba(0,0,0,0.4)' : '0px 4px 20px rgba(0,0,0,0.08)' },
              default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.4 : 0.08,
                shadowRadius: 20,
                elevation: 8,
              },
            }),
            borderWidth: 1, borderColor: isDark ? colors.border : 'rgba(255,255,255,0.5)',
          }}>
            {error ? (
              <View style={{
                backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2',
                borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca',
                borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={Colors.error} />
                <Text style={{ color: Colors.error, fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            {/* Username */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 8 }}>用户名</Text>
              <View style={inputWrapStyle}>
                <MaterialCommunityIcons name="account" size={20} color={colors.text.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 0, fontSize: 16, color: colors.text.primary }}
                  placeholder="输入用户名"
                  placeholderTextColor={colors.text.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 8 }}>邮箱</Text>
              <View style={inputWrapStyle}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.text.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 0, fontSize: 16, color: colors.text.primary }}
                  placeholder="输入邮箱"
                  placeholderTextColor={colors.text.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 8 }}>密码</Text>
              <View style={inputWrapStyle}>
                <MaterialCommunityIcons name="lock" size={20} color={colors.text.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 0, fontSize: 16, color: colors.text.primary }}
                  placeholder="输入密码（至少8位）"
                  placeholderTextColor={colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Confirm password */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 8 }}>确认密码</Text>
              <View style={inputWrapStyle}>
                <MaterialCommunityIcons name="lock-check" size={20} color={colors.text.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 0, fontSize: 16, color: colors.text.primary }}
                  placeholder="再次输入密码"
                  placeholderTextColor={colors.text.muted}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
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
              accessibilityRole="button"
              accessibilityLabel="创建账号"
              style={{
                backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 8,
                ...Platform.select({
                  web: { boxShadow: `0px 6px 12px ${Colors.primary}59` },
                  default: {
                    shadowColor: Colors.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    elevation: 8,
                  },
                }),
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
                  <MaterialCommunityIcons name="account-check" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>创建账号</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <Text style={{ color: colors.text.secondary, fontSize: 14 }}>已有账号？</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="前往登录">
                <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '600' }}>立即登录</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
