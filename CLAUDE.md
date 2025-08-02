# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

NovelBox 是一个基于 Electron + Vue.js 构建的 AI 辅助小说写作工具。它提供三栏写作界面，具备章节管理和 AI 文本重写功能。

## 主要功能

- AI 集成：支持 OpenAI 和 Google Gemini 兼容的 API
- 小说编辑器：三栏写作面板和章节管理
- 跨平台：基于 Electron 的桌面应用
- 统一通知系统：现代化的吐司通知替代 alert() 调用
- 主题支持：浅色/深色主题切换，使用 CSS 变量
- 国际化支持：配置支持中文和英文

## 技术栈

- Electron：桌面应用框架
- Vue.js 3：前端框架，使用组合式 API
- Vite：前端构建工具
- Pinia：状态管理
- Vue Router：路由管理
- Vue I18n：国际化（计划中）

## 开发命令

### 安装依赖
```bash
npm install
```

### 运行开发环境
此命令会同时启动 Vite 开发服务器和 Electron 应用。
```bash
npm run dev
```

### 构建应用
为你的操作系统构建可执行文件。
```bash
npm run dist
```

### 其他有用命令
- `npm run build`：构建 Vue.js 前端
- `npm run preview`：预览构建后的应用
- `npm run dev-vue`：仅运行 Vite 开发服务器
- `npm run dev-electron`：仅运行 Electron 应用

## 代码架构

### 主要入口点
- `src/App.vue`：主应用组件，包含通知容器
- `main.js`：Electron 主进程入口点
- `src/main.js`：Vue.js 应用入口点
- `src/services/index.js`：服务层导出
- `src/stores/index.js`：Pinia 存储导出

### 核心服务
- `src/services/llm.js`：LLM 服务实现，支持 OpenAI 和 Gemini 提供商
- `src/services/electron.js`：Electron 特定功能
- `src/services/utils.js`：工具函数
- `src/services/notifications.js`：统一通知服务

### 状态管理（Pinia 存储）
- `src/stores/novels.js`：小说数据管理
- `src/stores/chapters.js`：章节数据管理
- `src/stores/ui.js`：UI 状态管理
- `src/stores/notifications.js`：通知状态管理

### 关键组件
- `src/components/editor/MainEditor.vue`：主文本编辑器，带 AI 重写右键菜单
- `src/components/editor/AIPanel.vue`：用于显示重写结果的 AI 面板
- `src/components/editor/ContextMenu.vue`：文本操作的右键上下文菜单
- `src/components/editor/ChaptersList.vue`：章节导航和管理
- `src/components/settings/ProviderSettings.vue`：AI 提供商配置 UI
- `src/components/notifications/NotificationContainer.vue`：吐司通知系统
- `src/components/notifications/NotificationItem.vue`：单个通知组件

### 通知系统
项目使用统一的通知系统替代浏览器 alert() 调用：

```javascript
import { notificationService } from '@/services'

// 使用示例
notificationService.success('操作成功!')
notificationService.error('操作失败: ' + error.message)
notificationService.warning('请注意检查输入')
notificationService.info('这是一条提示信息')

// 高级用法
notificationService.notify({
  type: 'success',
  title: '自动保存',
  message: '文档已保存',
  duration: 3000
})
```

**禁止使用 alert()、confirm() 或其他阻塞式对话框。始终使用通知服务。**

### AI 集成流程
1. 用户在编辑器中选择文本并右键打开上下文菜单
2. 用户选择 AI 重写选项（扩展、收缩、美化、续写、自定义）
3. 选中的文本通过 llmService 发送到配置的 LLM 提供商
4. 结果在 AIPanel 组件中显示
5. 用户可以替换或插入重写后的文本

### 错误处理最佳实践
- 使用 notificationService 处理面向用户的错误消息
- 将详细错误记录到控制台用于调试
- 提供有意义的中文错误消息
- 优雅地处理网络错误
- 在处理前验证用户输入

### 安全考虑
- API 密钥存储在 localStorage 中（生产环境考虑加密）
- Electron 安全：禁用 nodeIntegration，启用 contextIsolation
- 在主进程中配置 CSP 头
- 无 eval() 或危险的 HTML 注入

## 配置
- AI 提供商在设置 UI 中配置并保存到 localStorage
- 主题和语言设置也存储在 localStorage 中
- 通知偏好可通过通知服务配置

## 文件组织
```
src/
├── components/
│   ├── editor/          # 文本编辑器组件
│   ├── modals/          # 模态对话框
│   ├── notifications/   # 通知系统
│   ├── oobe/           # 首次使用体验
│   └── settings/       # 设置面板
├── services/           # 业务逻辑和 API 调用
├── stores/            # Pinia 状态管理
├── styles/            # 全局样式和主题
└── views/             # 页面级组件
```

## 最近更新
- ✅ 实现统一通知系统（替换所有 alert() 调用）
- ✅ 修复 reactive/ref 使用模式以提高性能
- ✅ 在整个应用中添加适当的错误处理
- ✅ 改进组件架构和关注点分离

## 开发指南
- 新的 Vue 组件使用组合式 API
- 遵循已建立的通知模式进行用户反馈
- 对象使用 reactive()，原始类型和 DOM 引用使用 ref()
- 使用 TypeScript 风格的 JSDoc 注释以获得更好的 IDE 支持
- 添加新功能时测试通知流程
- 在面向用户的文本中保持中文语言支持