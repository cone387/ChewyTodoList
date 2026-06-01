# App Store 上架准备清单

## 📋 检查项状态

### ✅ 已完成

- [x] 隐私政策页面 (`/privacy-policy`)
- [x] 基础 app.config.ts 配置
- [x] iOS 隐私清单配置
- [x] 通知权限说明
- [x] TypeScript 类型检查
- [x] 错误边界处理

### 🟡 需要手动完成

#### 1. 图标和启动画面（重要）

**应用图标** (必需)
- [ ] 设计 1024x1024 PNG 图标
- [ ] 放置在 `assets/icon.png`
- [ ] 放置在 `assets/adaptive-icon.png` (Android)
- [ ] 通知图标 `assets/notification-icon.png` (96x96)

**设计指南：**
- 简洁易识别
- 避免过多细节
- 考虑缩小后的可读性
- 参考: https://developer.apple.com/design/human-interface-guidelines/app-icons

**工具推荐：**
- Figma: https://figma.com
- Canva: https://canva.com
- Sketch: https://sketch.com

#### 2. 启动画面

- [ ] 设计 `assets/splash-icon.png` (建议 2048x2048)
- [ ] 或使用 Expo 自动生成: `npx expo start` 会自动处理

#### 3. App Store 元数据

**需要在 App Store Connect 填写：**
- [ ] 应用名称：ChewyTodo
- [ ] 副标题：简洁的任务管理
- [ ] 描述：（见下方模板）
- [ ] 关键词：todo,task,reminder,productivity
- [ ] 分类：生产力
- [ ] 年龄分级：4+
- [ ] 价格：免费
- [ ] 支持网址：https://your-domain.com
- [ ] 营销网址（可选）

#### 4. 应用截图

**必需尺寸：**
- [ ] iPhone 6.7" (1290 x 2796 像素) - 最少 3 张
- [ ] iPhone 6.5" (1242 x 2688 像素) - 最少 3 张
- [ ] iPad Pro 12.9" (2048 x 2732 像素) - 如果支持 iPad

**截图内容建议：**
1. 首页 - 任务列表
2. 看板视图
3. 日历视图
4. 任务详情
5. 深色模式

**生成工具：**
- Xcode Simulator
- Expo Go App
- 截图工具: https://screenshots.pro

### 🔴 上架前必须完成

#### 合规性

- [ ] 隐私政策网址（可托管在 GitHub Pages）
- [ ] 用户协议/EULA
- [ ] 数据收集声明（App Store Connect 中填写）
- [ ] 通知权限使用说明

#### 技术检查

- [ ] 所有 TypeScript 错误已修复
- [ ] 应用可以成功构建: `eas build --platform ios`
- [ ] 真机测试通过（iOS 15+）
- [ ] 性能优化（启动时间 < 3 秒）
- [ ] 崩溃率 < 1%
- [ ] 离线模式正常工作

#### 测试清单

- [ ] 在 iPhone SE 测试（小屏幕）
- [ ] 在 iPhone 15 Pro Max 测试（大屏幕）
- [ ] 在 iPad 测试（如果支持）
- [ ] 测试深色模式
- [ ] 测试通知功能
- [ ] 测试离线模式
- [ ] 测试账户登录/注册
- [ ] 测试数据同步
- [ ] 测试各种手势操作

---

## 📝 App Store 描述模板

### 应用描述

```
ChewyTodo - 简洁强大的任务管理工具

【核心功能】
• 📝 轻松创建和管理待办事项
• 📊 6 种视图：列表、看板、日历、表格、时间线、画廊
• 🔄 重复任务自动化设置
• 🔔 智能提醒，不再错过重要事项
• 🏷️ 项目和标签分类管理
• 🔍 强大的搜索和筛选功能
• 🌙 深色模式支持

【隐私优先】
• 数据存储在您自己的服务器
• 不收集个人信息
• 不追踪用户行为
• 支持自托管部署

【使用场景】
• 工作任务管理
• 学习计划安排
• 日常生活待办
• 项目进度跟踪
• 习惯养成

【特色优势】
• 简洁直观的界面设计
• 灵活的视图切换
• 强大的自定义能力
• 跨平台数据同步
• 开源可信赖

立即下载 ChewyTodo，开启高效生活！
```

### 关键词（100 字符限制）

```
todo,task,reminder,productivity,calendar,kanban,project,habit,organize,plan
```

---

## 🚀 构建和提交流程

### 1. 构建应用

```bash
cd mobile

# 开发构建（测试）
npx eas build --profile development --platform ios

# 预览构建（内部分发）
npx eas build --profile preview --platform ios

# 生产构建（上架）
npx eas build --profile production --platform ios
```

### 2. 提交到 App Store

```bash
# 提交构建版本
npx eas submit --platform ios
```

### 3. App Store Connect 设置

1. 登录 https://appstoreconnect.apple.com
2. 选择应用
3. 填写元数据
4. 上传截图
5. 提交审核

---

## ⚠️ 常见审核被拒原因

1. **隐私问题**
   - ❌ 缺少隐私政策链接
   - ❌ 未说明数据收集用途
   - ✅ 已准备：隐私政策页面

2. **功能问题**
   - ❌ 应用崩溃
   - ❌ 功能不完整
   - ✅ 需要：充分测试

3. **内容问题**
   - ❌ 截图与实际不符
   - ❌ 描述夸大功能
   - ✅ 需要：真实准确

4. **元数据问题**
   - ❌ 缺少必要字段
   - ❌ 分类错误
   - ✅ 参考本清单填写

---

## 📞 支持资源

- Apple Developer: https://developer.apple.com
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Expo 文档: https://docs.expo.dev
- 项目 Issues: https://github.com/cone387/ChewyTodoList/issues

---

## 📅 时间表

| 任务 | 预计时间 | 状态 |
|------|---------|------|
| 设计图标 | 2-4 小时 | ⏳ |
| 准备截图 | 1-2 小时 | ⏳ |
| 填写元数据 | 30 分钟 | ⏳ |
| 构建应用 | 30-60 分钟 | ⏳ |
| 提交审核 | 15 分钟 | ⏳ |
| 审核等待 | 24-48 小时 | ⏳ |
| **总计** | **1-2 天** | |

---

**最后更新**: 2025年5月28日
