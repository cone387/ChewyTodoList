# App Store 上架准备进度总结

## ✅ 已完成（自动化部分）

### 1. 隐私与合规
- ✅ **隐私政策页面** - `mobile/app/privacy-policy.tsx`
  - 完整的信息收集声明
  - 数据存储与安全说明
  - 用户权利说明
  - 联系方式
  
- ✅ **iOS 隐私清单** - `app.config.ts` 中已配置
  - NSPrivacyAccessedAPITypes
  - NSPrivacyCollectedDataTypes
  - 通知权限使用说明

### 2. 配置优化
- ✅ **app.config.ts 更新**
  - Bundle ID: com.chewytodo.app
  - 版本号: 1.0.0
  - Splash Screen 配置
  - 通知权限配置
  - 隐私清单配置

- ✅ **API 地址配置**
  - 开发环境: localhost:8400
  - 生产环境: 需替换为实际域名

### 3. 文档和清单
- ✅ **APP_STORE_CHECKLIST.md** - 完整的上架检查清单
  - 图标和截图要求
  - 元数据填写模板
  - 构建和提交流程
  - 常见审核被拒原因
  
- ✅ **generate-icons.js** - 图标生成检查脚本

---

## 🟡 需要你手动完成

### 1. 设计应用图标（最重要）⭐⭐⭐

**需要创建的文件：**
```
mobile/assets/
├── icon.png              (1024x1024) 应用图标
├── adaptive-icon.png     (1024x1024) Android 自适应图标
├── splash-icon.png       (2048x2048) 启动画面
└── notification-icon.png (96x96)    通知图标
```

**设计要求：**
- 简洁易识别
- 避免文字（或极少文字）
- 考虑缩小后的可读性
- 符合 Apple HIG 规范

**设计工具推荐：**
- Figma (免费): https://figma.com
- Canva (简单): https://canva.com
- Iconion (图标生成): https://iconion.com

**参考示例：**
- Things 3: 简洁的勾号
- Todoist: 红色圆圈
- Apple Reminders: 白色列表

**完成后：** 将文件放入 `mobile/assets/` 目录

---

### 2. 准备应用截图

**需要截图的页面：**
1. 任务列表页（首页）
2. 看板视图
3. 日历视图
4. 任务详情页
5. 深色模式展示

**截图尺寸：**
- iPhone 6.7": 1290 x 2796 像素
- iPhone 6.5": 1242 x 2688 像素
- iPad 12.9": 2048 x 2732 像素（如支持）

**截图方法：**
```bash
# 在 iOS 模拟器中
xcrun simctl boot "iPhone 15 Pro"
xcrun simctl openurl booted http://localhost:8081

# 截图
xcrun simctl io booted screenshot screenshot.png
```

**或使用真机：**
- 连接 iPhone
- 按电源键 + 音量上键截图

---

### 3. App Store Connect 注册

**步骤：**
1. 注册 Apple Developer 账号 ($99/年)
   https://developer.apple.com/programs/enroll/

2. 登录 App Store Connect
   https://appstoreconnect.apple.com

3. 创建新应用
   - 名称: ChewyTodo
   - Bundle ID: com.chewytodo.app
   - SKU: chewytodo-001

4. 填写元数据（参考 APP_STORE_CHECKLIST.md 中的模板）

---

### 4. 构建应用

**前提条件：**
```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录
eas login

# 配置项目（首次）
cd mobile
eas build:configure
```

**构建命令：**
```bash
cd mobile

# 开发构建（测试）
eas build --profile development --platform ios

# 生产构建（上架）
eas build --profile production --platform ios
```

**预计时间：** 30-60 分钟（云端构建）

---

### 5. 提交审核

```bash
# 提交到 App Store
eas submit --platform ios

# 或在 App Store Connect 手动上传构建版本
```

---

## 📅 推荐时间表

| 日期 | 任务 | 预计时间 |
|------|------|---------|
| 今天 | 设计图标 | 2-4 小时 |
| 明天 | 截图 + 元数据 | 1-2 小时 |
| 后天 | 构建 + 提交 | 1 小时 |
| 等待 | 审核 | 24-48 小时 |

---

## 🎯 下一步行动

### 立即执行（优先级最高）
1. ⭐⭐⭐ 设计并添加应用图标
2. 运行 `node mobile/scripts/generate-icons.js` 检查

### 本周完成
3. 准备 5-6 张应用截图
4. 注册 Apple Developer 账号
5. 填写 App Store Connect 元数据

### 下周完成
6. 构建生产版本
7. 提交审核
8. 准备推广材料

---

## 📞 需要帮助？

遇到问题时可以：
1. 查看 `mobile/APP_STORE_CHECKLIST.md` 详细清单
2. 参考项目 Issues: https://github.com/cone387/ChewyTodoList/issues
3. 查阅 Expo 文档: https://docs.expo.dev
4. Apple 审核指南: https://developer.apple.com/app-store/review/guidelines/

---

**当前进度**: 40% 完成  
**预计上架时间**: 3-5 天（取决于图标设计和审核速度）

**最后更新**: 2025年5月28日
