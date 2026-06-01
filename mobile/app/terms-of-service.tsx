import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsOfServicePage() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>用户服务协议</Text>
        <Text style={styles.updateDate}>最后更新：2025年5月28日</Text>

        <Text style={styles.paragraph}>
          欢迎使用 ChewyTodo！本协议是您与 ChewyTodo 开发团队之间关于使用本应用的条款。
          使用本应用即表示您同意接受这些条款。
        </Text>

        <Text style={styles.sectionTitle}>1. 服务说明</Text>
        <Text style={styles.paragraph}>
          ChewyTodo 是一款任务管理和待办事项应用，提供以下核心功能：
        </Text>
        <Text style={styles.bullet}>• 任务创建、编辑、删除和完成</Text>
        <Text style={styles.bullet}>• 多种视图：列表、看板、日历、表格等</Text>
        <Text style={styles.bullet}>• 提醒通知功能</Text>
        <Text style={styles.bullet}>• 项目和标签分类</Text>
        <Text style={styles.bullet}>• 数据同步（需自托管服务器）</Text>

        <Text style={styles.sectionTitle}>2. 账户管理</Text>
        <Text style={styles.paragraph}>
          • 您需要提供有效的邮箱地址注册账户{'\n'}
          • 您有责任保管账户密码{'\n'}
          • 禁止共享账户给他人使用{'\n'}
          • 如怀疑账户被盗，请立即联系我们
        </Text>

        <Text style={styles.sectionTitle}>3. 用户行为规范</Text>
        <Text style={styles.paragraph}>
          使用 ChewyTodo 时，您同意：
        </Text>
        <Text style={styles.bullet}>• 不发布违法或不当内容</Text>
        <Text style={styles.bullet}>• 不利用本应用从事非法活动</Text>
        <Text style={styles.bullet}>• 不尝试破解、入侵或干扰服务运行</Text>
        <Text style={styles.bullet}>• 遵守所有适用的法律法规</Text>

        <Text style={styles.sectionTitle}>4. 数据存储与隐私</Text>
        <Text style={styles.paragraph}>
          • 您的数据存储在您自己控制的服务器上{'\n'}
          • 我们不会访问或分析您的个人数据{'\n'}
          • 数据传输使用 HTTPS 加密{'\n'}
          • 详细信息请参阅我们的隐私政策
        </Text>

        <Text style={styles.sectionTitle}>5. 知识产权</Text>
        <Text style={styles.paragraph}>
          ChewyTodo 的代码、设计、图标、文档等所有内容均受版权法保护。未经授权，不得复制、修改或分发。
        </Text>

        <Text style={styles.sectionTitle}>6. 服务中断与维护</Text>
        <Text style={styles.paragraph}>
          • 我们会尽量减少服务中断{'\n'}
          • 计划维护会提前通知{'\n'}
          • 不对不可抗力导致的中断负责{'\n'}
          • 您应定期备份重要数据
        </Text>

        <Text style={styles.sectionTitle}>7. 免责声明</Text>
        <Text style={styles.paragraph}>
          本应用按"现状"提供，我们不保证：
        </Text>
        <Text style={styles.bullet}>• 服务永不中断或完全无错误</Text>
        <Text style={styles.bullet}>• 数据绝对安全（尽管我们采取了合理措施）</Text>
        <Text style={styles.bullet}>• 满足您的所有特定需求</Text>

        <Text style={styles.sectionTitle}>8. 责任限制</Text>
        <Text style={styles.paragraph}>
          在法律允许的最大范围内，ChewyTodo 开发团队不对以下情况负责：
        </Text>
        <Text style={styles.bullet}>• 数据丢失或损坏（建议您定期备份）</Text>
        <Text style={styles.bullet}>• 因使用本应用导致的间接损失</Text>
        <Text style={styles.bullet}>• 第三方服务中断造成的影响</Text>

        <Text style={styles.sectionTitle}>9. 服务变更与终止</Text>
        <Text style={styles.paragraph}>
          • 我们保留修改或终止服务的权利{'\n'}
          • 重大变更会提前通知{'\n'}
          • 您可随时停止使用并删除数据
        </Text>

        <Text style={styles.sectionTitle}>10. 协议更新</Text>
        <Text style={styles.paragraph}>
          我们可能会不时更新本协议。重大变更将通过应用内通知或邮件告知。继续使用即表示您接受更新后的协议。
        </Text>

        <Text style={styles.sectionTitle}>11. 开源许可</Text>
        <Text style={styles.paragraph}>
          ChewyTodo 是开源项目，遵循相应的开源许可证。详情请查看项目仓库。
        </Text>

        <Text style={styles.sectionTitle}>12. 联系方式</Text>
        <Text style={styles.paragraph}>
          如对本协议有任何疑问，请联系我们：
        </Text>
        <Text style={styles.contact}>邮箱：support@chewytodo.com</Text>
        <Text style={styles.contact}>GitHub：https://github.com/cone387/ChewyTodoList</Text>

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
    marginBottom: 4,
  },
  spacer: {
    height: 40,
  },
});
