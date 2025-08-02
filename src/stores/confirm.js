import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 确认框配置类型
 */
export class ConfirmOptions {
  constructor({
    type = 'default',
    title = '',
    message = '',
    confirmText = '确认',
    cancelText = '取消',
    asyncAction = false,
    closeOnOverlay = true
  } = {}) {
    this.type = type
    this.title = title
    this.message = message
    this.confirmText = confirmText
    this.cancelText = cancelText
    this.asyncAction = asyncAction
    this.closeOnOverlay = closeOnOverlay
  }
}

/**
 * 确认框 Store
 */
export const useConfirmStore = defineStore('confirm', () => {
  const isVisible = ref(false)
  const currentConfirm = ref(null)
  let currentResolve = null

  /**
   * 显示确认框
   */
  const showConfirm = (options) => {
    return new Promise((resolve) => {
      currentConfirm.value = new ConfirmOptions(options)
      currentResolve = resolve
      isVisible.value = true
    })
  }

  /**
   * 解决确认框
   */
  const resolve = (result) => {
    isVisible.value = false
    if (currentResolve) {
      currentResolve(result)
      currentResolve = null
    }
    // 延迟清理，等待动画完成
    setTimeout(() => {
      currentConfirm.value = null
    }, 300)
  }

  /**
   * 关闭确认框
   */
  const hideConfirm = () => {
    resolve(false)
  }

  return {
    isVisible,
    currentConfirm,
    showConfirm,
    resolve,
    hideConfirm
  }
})