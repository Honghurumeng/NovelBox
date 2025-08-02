# 通知系统使用说明

## 功能特性

- ✅ 统一的通知接口，替代原有的 `alert()` 调用
- ✅ 支持多种通知类型：成功、错误、警告、信息
- ✅ 自动消失机制（可配置）
- ✅ 优雅的动画效果
- ✅ 响应式设计，支持移动端
- ✅ 主题适配（浅色/深色主题）
- ✅ 最大通知数量限制
- ✅ TypeScript 友好的 API

## 基本使用

### 在组件中使用

```javascript
import { notificationService } from '@/services'

// 成功通知
notificationService.success('操作成功!')

// 错误通知  
notificationService.error('操作失败: ' + error.message)

// 警告通知
notificationService.warning('请注意检查输入')

// 信息通知
notificationService.info('这是一条提示信息')
```

### 高级用法

```javascript
// 自定义持续时间
notificationService.success('自动保存成功', {
  duration: 2000 // 2秒后消失
})

// 持久显示（需要手动关闭）
notificationService.error('严重错误', {
  persistent: true,
  duration: 0
})

// 带标题的通知
notificationService.info('更新可用', {
  title: '系统提示',
  message: '发现新版本，是否立即更新？'
})

// 禁用关闭按钮
notificationService.warning('正在处理中...', {
  showClose: false,
  persistent: true
})
```

## API 参考

### NotificationService 方法

| 方法 | 参数 | 描述 |
|------|------|------|
| `success(message, options?)` | message: string, options: object | 显示成功通知 |
| `error(message, options?)` | message: string, options: object | 显示错误通知 |
| `warning(message, options?)` | message: string, options: object | 显示警告通知 |
| `info(message, options?)` | message: string, options: object | 显示信息通知 |
| `notify(notificationData)` | notificationData: object | 显示自定义通知 |
| `clearAll()` | - | 清空所有通知 |

### 通知选项 (Options)

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `title` | string | '' | 通知标题 |
| `duration` | number | 4000 | 显示时长（毫秒），0表示不自动关闭 |
| `showClose` | boolean | true | 是否显示关闭按钮 |
| `persistent` | boolean | false | 是否持久显示 |

### 通知类型

- `success`: 绿色，用于成功操作反馈
- `error`: 红色，用于错误信息显示  
- `warning`: 橙色，用于警告提醒
- `info`: 蓝色，用于一般信息提示

## 已替换的文件

以下文件中的 `alert()` 调用已全部替换为通知系统：

- ✅ `src/components/settings/ProviderSettings.vue`
- ✅ `src/views/Homepage.vue`
- ✅ `src/views/EditorPage.vue`
- ✅ `src/components/editor/ChaptersList.vue`
- ✅ `src/components/modals/NewNovelModal.vue`
- ✅ `src/components/settings/StorageSettings.vue`

## 样式定制

通知组件自动适配应用的主题系统，支持：

- 浅色主题适配
- 深色主题适配
- 响应式布局
- 平滑的进入/退出动画

## 性能优化

- 最大同时显示 5 个通知
- 异步组件加载
- 自动内存清理
- 防抖处理

## 开发建议

1. **统一使用**: 项目中不再使用 `alert()`、`confirm()` 等原生弹窗
2. **合适的类型**: 根据消息性质选择合适的通知类型
3. **简洁明了**: 通知文本应该简洁明了，避免过长
4. **错误处理**: 错误通知应该提供有用的错误信息

## 未来扩展

计划中的功能扩展：

- [ ] 添加确认对话框支持
- [ ] 添加加载状态通知
- [ ] 支持自定义图标
- [ ] 支持操作按钮
- [ ] 添加音效支持