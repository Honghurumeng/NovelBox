import { defineStore } from 'pinia'
import { reactive } from 'vue'

/**
 * 通知类型定义
 */
export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info'
}

/**
 * 通知项数据结构
 */
export class NotificationItem {
  constructor({
    id = Date.now() + Math.random(),
    type = NotificationType.INFO,
    title = '',
    message = '',
    duration = 4000, // 毫秒，0表示不自动关闭
    showClose = true,
    persistent = false // 是否持久化显示
  } = {}) {
    this.id = id
    this.type = type
    this.title = title
    this.message = message
    this.duration = duration
    this.showClose = showClose
    this.persistent = persistent
    this.timestamp = Date.now()
  }
}

/**
 * 通知 Store
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = reactive([])
  const maxNotifications = 5 // 最大同时显示的通知数量

  /**
   * 添加通知
   */
  const addNotification = (notificationData) => {
    const notification = new NotificationItem(notificationData)
    
    // 如果超过最大数量，移除最早的通知
    if (notifications.length >= maxNotifications) {
      notifications.shift()
    }
    
    notifications.push(notification)
    
    // 设置自动移除
    if (notification.duration > 0 && !notification.persistent) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration)
    }
    
    return notification.id
  }

  /**
   * 移除通知
   */
  const removeNotification = (id) => {
    const index = notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.splice(index, 1)
    }
  }

  /**
   * 清空所有通知
   */
  const clearAll = () => {
    notifications.splice(0)
  }

  /**
   * 便捷方法 - 成功通知
   */
  const success = (message, options = {}) => {
    return addNotification({
      type: NotificationType.SUCCESS,
      message,
      ...options
    })
  }

  /**
   * 便捷方法 - 错误通知
   */
  const error = (message, options = {}) => {
    return addNotification({
      type: NotificationType.ERROR,
      message,
      duration: 6000, // 错误信息显示更久
      ...options
    })
  }

  /**
   * 便捷方法 - 警告通知
   */
  const warning = (message, options = {}) => {
    return addNotification({
      type: NotificationType.WARNING,
      message,
      duration: 5000,
      ...options
    })
  }

  /**
   * 便捷方法 - 信息通知
   */
  const info = (message, options = {}) => {
    return addNotification({
      type: NotificationType.INFO,
      message,
      ...options
    })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
})