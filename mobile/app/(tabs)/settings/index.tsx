import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { authApi } from '../../../shared/services/api';
import { useToast } from '../../../hooks/useToast';
import { Colors } from '../../../constants/theme';

export default function SettingsPage() {
  const { logout } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<{ username: string; email: string } | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    authApi.getProfile().then((res) => {
      const data = res.data.data || res.data;
      setProfile({ username: data.username, email: data.email });
    }).catch(() => {});
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('error', '请填写所有密码字段');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', '两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', '新密码至少6个字符');
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      showToast('success', '密码修改成功');
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || '密码修改失败';
      showToast('error', msg);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111418' }}>我的</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile section */}
        <View style={{ marginTop: 16, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#f3f0ff', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, color: Colors.primary }}>
                {profile?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111418' }}>{profile?.username || '加载中...'}</Text>
              <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{profile?.email || ''}</Text>
            </View>
          </View>
        </View>

        {/* Settings items */}
        <View style={{ marginTop: 16, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
          {/* Tag management */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
            onPress={() => router.push('/(tabs)/settings/tags' as any)}
          >
            <Text style={{ fontSize: 15, color: '#374151', flex: 1 }}>标签管理</Text>
            <Text style={{ color: '#d1d5db' }}>›</Text>
          </TouchableOpacity>

          {/* Change password */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <Text style={{ fontSize: 15, color: '#374151', flex: 1 }}>修改密码</Text>
            <Text style={{ color: '#d1d5db' }}>{showChangePassword ? '▲' : '›'}</Text>
          </TouchableOpacity>

          {showChangePassword && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 10, backgroundColor: '#f9fafb' }}>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111418', backgroundColor: '#fff' }}
                placeholder="当前密码"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111418', backgroundColor: '#fff' }}
                placeholder="新密码"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111418', backgroundColor: '#fff' }}
                placeholder="确认新密码"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={{ backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', opacity: changingPassword ? 0.7 : 1 }}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>确认修改</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* About */}
        <View style={{ marginTop: 16, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 15, color: '#374151', flex: 1 }}>版本</Text>
            <Text style={{ fontSize: 14, color: '#9ca3af' }}>1.0.0</Text>
          </View>
        </View>

        {/* Logout */}
        <View style={{ marginTop: 24, marginHorizontal: 16 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}
            onPress={logout}
          >
            <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '500', flex: 1 }}>退出登录</Text>
            <Text style={{ color: '#fca5a5' }}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
