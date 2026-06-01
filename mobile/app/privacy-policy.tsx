import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyPage() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>隐私政策</Text>
        <Text style={styles.updateDate}>最后更新：2025年5月28日</Text>

        <Text style={styles.sectionTitle}>1. 信息收集</Text>
        <Text style={styles.paragraph}>
          ChewyTodo 是一款注重隐私的待办事项管理应用。我们采用自托管架构，您的所有数据都存储在您自己控制的服务器上。
        </Text>
        <Text style={styles.subTitle}>我们收集的信息：</Text>
        <Text style={styles.bullet}>• 账户信息：邮箱地址（用于登录认证）</Text>
        <Text style={styles.bullet}>• 用户数据：您创建的任务、项目、标签等内容</Text>
        <Text style={styles.bullet}>• 设备信息：用于推送通知的设备令牌</Text>

        <Text style={styles.subTitle}>我们不收集的信息：</Text>
        <Text style={styles.bullet}>• 位置信息</Text>
        <Text style={styles.bullet}>• 通讯录数据</Text>
        <Text style={styles.bullet}>• 第三方分析数据</Text>
        <Text style={styles.bullet}>• 广告追踪标识符</Text>

        <Text style={styles.sectionTitle}>2. 信息使用</Text>
        <Text style={styles.paragraph}>
          我们收集的信息仅用于：
        </Text>
        <Text style={styles.bullet}>• 提供任务管理功能</Text>
        <Text style={styles.bullet}>• 发送提醒通知</Text>
        <Text style={styles.bullet}>• 改进应用性能和用户体验</Text>

        <Text style={styles.sectionTitle}>3. 数据存储与安全</Text>
        <Text style={styles.paragraph}>
          • 所有数据通过 HTTPS 加密传输{'\n'}
          • 密码使用 bcrypt 加密存储{'\n'}
          • JWT 令牌用于身份验证{'\n'}
          • 数据存储在您自己的服务器或您选择的服务提供商
        </Text>

        <Text style={styles.sectionTitle}>4. 数据共享</Text>
        <Text style={styles.paragraph}>
          我们不会将您的个人信息出售、交易或出租给任何第三方。您的数据完全由您控制。
        </Text>

        <Text style={styles.sectionTitle}>5. 通知权限</Text>
        <Text style={styles.paragraph}>
          ChewyTodo 请求通知权限以发送任务提醒。通知数据仅存储在您的设备上，我们不会访问通知内容。
        </Text>

        <Text style={styles.sectionTitle}>6. 您的权利</Text>
        <Text style={styles.paragraph}>
          您有权随时：
        </Text>
        <Text style={styles.bullet}>• 查看、修改、删除您的数据</Text>
        <Text style={styles.bullet}>• 导出您的所有数据</Text>
        <Text style={styles.bullet}>• 注销账户</Text>

        <Text style={styles.sectionTitle}>7. 儿童隐私</Text>
        <Text style={styles.paragraph}>
          ChewyTodo 不面向 13 岁以下儿童。我们不会故意收集儿童的个人信息。
        </Text>

        <Text style={styles.sectionTitle}>8. 政策更新</Text>
        <Text style={styles.paragraph}>
          我们可能会不时更新本隐私政策。重大变更将通过应用内通知告知。
        </Text>

        <Text style={styles.sectionTitle}>9. 联系我们</Text>
        <Text style={styles.paragraph}>
          如果您对本隐私政策有任何疑问，请通过以下方式联系我们：
        </Text>
        <Text style={styles.contact}>邮箱：support@chewytodo.com</Text>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e1b4b',
    marginBottom: 8,
  },
  updateDate: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1b4b',
    marginTop: 24,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 28,
    marginLeft: 8,
  },
  contact: {
    fontSize: 15,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});
