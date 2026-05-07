/**
 * 隐私政策页面 — App Store 审核必备
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

export default function PrivacyPolicyPage() {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 0.5, borderBottomColor: colors.borderLight }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text.primary }}>隐私政策</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: 4 }}>
            ChewyTodo 隐私政策
          </Text>
          <Text style={{ fontSize: 13, color: colors.text.muted, marginBottom: 20 }}>
            最后更新：2026 年 5 月
          </Text>

          <Section title="1. 信息收集" colors={colors}>
            我们收集以下信息以提供服务：{'\n'}
            {'•'} 账户信息：用户名、邮箱地址{'\n'}
            {'•'} 任务数据：您创建的任务、项目、标签等内容{'\n'}
            {'•'} 设备信息：设备类型、操作系统版本（用于推送通知）
          </Section>

          <Section title="2. 信息使用" colors={colors}>
            我们使用收集的信息：{'\n'}
            {'•'} 提供、维护和改进我们的服务{'\n'}
            {'•'} 发送任务提醒通知{'\n'}
            {'•'} 确保账户安全
          </Section>

          <Section title="3. 信息存储" colors={colors}>
            您的数据存储在安全的服务器上，我们采用行业标准的加密技术保护传输中的数据。
            任务数据会在您的设备上本地缓存以提供离线访问能力。
          </Section>

          <Section title="4. 信息共享" colors={colors}>
            我们不会出售、交易或以其他方式将您的个人信息转让给第三方。
            以下情况例外：{'\n'}
            {'•'} 获得您的明确同意{'\n'}
            {'•'} 法律法规要求
          </Section>

          <Section title="5. 本地通知" colors={colors}>
            我们使用设备的本地通知功能发送任务提醒。通知内容仅在您的设备上生成和显示，
            不会经过第三方服务器。您可以随时在系统设置中关闭通知权限。
          </Section>

          <Section title="6. 数据删除" colors={colors}>
            您可以随时删除您的账户和所有相关数据。删除操作不可逆，
            一旦删除，我们将无法恢复您的数据。
          </Section>

          <Section title="7. 儿童隐私" colors={colors}>
            我们的服务不面向 13 岁以下的儿童。我们不会故意收集 13 岁以下儿童的个人信息。
          </Section>

          <Section title="8. 政策更新" colors={colors}>
            我们可能会不时更新本隐私政策。更新后的政策将在应用内公布，
            继续使用即视为接受更新后的政策。
          </Section>

          <Section title="9. 联系我们" colors={colors}>
            如果您对本隐私政策有任何疑问，请通过以下方式联系我们：{'\n'}
            邮箱：support@chewytodo.app
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 8 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: colors.text.secondary, lineHeight: 22 }}>
        {children}
      </Text>
    </View>
  );
}
