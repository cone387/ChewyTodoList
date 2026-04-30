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

export default function LoginPage() {
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      if (__DEV__) {
        console.error('Login error:', JSON.stringify({
          message: err?.message,
          code: err?.code,
          status: err?.response?.status,
          data: err?.response?.data,
          url: err?.config?.url,
          baseURL: err?.config?.baseURL,
        }, null, 2));
      }
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        (err?.code === 'ERR_NETWORK'
          ? `网络错误：无法连接到服务器`
          : '登录失败，请检查用户名和密码');
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
    <View style={{ flex: 1, backgroundColor: isDark ? colors.background.primary : '#f0f0ff' }}>
      <View style={{ position: 'absolute', top: -80, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.primary + (isDark ? '20' : '14') }} />
      <View style={{ position: 'absolute', bottom: -80, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.primary + (isDark ? '18' : '0D') }} />

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
              <MaterialCommunityIcons name="check-bold" size={36} color="#fff" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: isDark ? colors.text.primary : '#1e1b4b', marginBottom: 6 }}>
              欢迎回来
            </Text>
            <Text style={{ fontSize: 15, color: colors.text.secondary }}>
              继续您的高效之旅
            </Text>
          </View>

          {/* Form card */}
          <View style={{
            backgroundColor: isDark ? colors.card : 'rgba(255,255,255,0.75)',
            borderRadius: 24, padding: 24,
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
            borderWidth: 1, borderColor: isDark ? colors.border : 'rgba(255,255,255,0.6)',
          }}>
            {error ? (
              <View style={{
                backgroundColor: colors.error + '14', borderWidth: 1, borderColor: '#fecaca',
                borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
                <Text style={{ color: colors.error, fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            {/* Username — no colored focus border */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 8, lineHeight: 18 }}>用户名</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 1, borderColor: colors.border,
                borderRadius: 16, backgroundColor: colors.background.secondary,
                paddingHorizontal: 14, height: 48,
              }}>
                <MaterialCommunityIcons name="account" size={20} color={colors.text.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: colors.text.primary, paddingVertical: 0 }}
                  placeholder="输入用户名"
                  placeholderTextColor={colors.text.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password — no colored focus border */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 8, lineHeight: 18 }}>密码</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 1, borderColor: colors.border,
                borderRadius: 16, backgroundColor: colors.background.secondary,
                paddingHorizontal: 14, height: 48,
              }}>
                <MaterialCommunityIcons name="lock" size={20} color={colors.text.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: colors.text.primary, paddingVertical: 0 }}
                  placeholder="输入密码"
                  placeholderTextColor={colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? '隐藏密码' : '显示密码'}
                >
                  <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick login — dev only */}
            {__DEV__ && (
              <View style={{
                backgroundColor: isDark ? 'rgba(59,130,246,0.14)' : '#eff6ff', borderRadius: 16, padding: 14,
                borderWidth: 1, borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe50',
                flexDirection: 'row', alignItems: 'center', marginBottom: 20,
              }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginRight: 10,
                }}>
                  <MaterialCommunityIcons name="lightning-bolt" size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#93c5fd' : '#1d4ed8' }}>演示账户</Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#60a5fa' : '#3b82f6' }}>快速体验应用功能</Text>
                </View>
                <TouchableOpacity
                  onPress={handleQuickLogin}
                  style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="使用演示账户"
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>一键填入</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Login button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                borderRadius: 16, paddingVertical: 16,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 8,
                backgroundColor: Colors.primary,
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
                  <MaterialCommunityIcons name="login" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>立即登录</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ paddingHorizontal: 16, fontSize: 13, color: colors.text.muted }}>或者</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {/* Register link */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.text.secondary, fontSize: 14, marginBottom: 12 }}>还没有账户？</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: colors.background.tertiary, borderRadius: 16,
                  paddingHorizontal: 24, paddingVertical: 12,
                }}
                accessibilityRole="button"
                accessibilityLabel="前往注册"
              >
                <MaterialCommunityIcons name="account-plus" size={18} color={colors.text.secondary} />
                <Text style={{ color: colors.text.secondary, fontSize: 15, fontWeight: '600' }}>创建新账户</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={{ textAlign: 'center', fontSize: 12, color: colors.text.muted, marginTop: 24 }}>
            © 2026 ChewyTodo · 让效率成为习惯
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
