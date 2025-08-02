import { useNotificationsStore } from '@/stores/notifications'

/**
 * 通知服务 - 提供全局可用的通知方法
 */
class NotificationService {
  constructor() {
    this.store = null
  }

  // 初始化store引用（在组件中调用）
  init() {
    if (!this.store) {
      this.store = useNotificationsStore()
    }
    return this.store
  }

  // 成功通知
  success(message, options = {}) {
    this.init()
    return this.store.success(message, options)
  }

  // 错误通知
  error(message, options = {}) {
    this.init()
    return this.store.error(message, options)
  }

  // 警告通知
  warning(message, options = {}) {
    this.init()
    return this.store.warning(message, options)
  }

  // 信息通知
  info(message, options = {}) {
    this.init()
    return this.store.info(message, options)
  }

  // 通用通知
  notify(notificationData) {
    this.init()
    return this.store.addNotification(notificationData)
  }

  // 清空所有通知
  clearAll() {
    this.init()
    return this.store.clearAll()
  }
}

// 创建单例实例
export const notificationService = new NotificationService()

// 导出便捷方法
export const { success, error, warning, info, notify, clearAll } = notificationService

// 为了向后兼容，也可以导出整个服务
export default notificationService