import { useConfirmStore } from '@/stores/confirm'

/**
 * 确认框服务 - 提供全局可用的确认框方法
 */
class ConfirmService {
  constructor() {
    this.store = null
  }

  // 初始化store引用（在组件中调用）
  init() {
    if (!this.store) {
      this.store = useConfirmStore()
    }
    return this.store
  }

  /**
   * 通用确认框
   */
  async confirm(message, options = {}) {
    this.init()
    return await this.store.showConfirm({
      message,
      ...options
    })
  }

  /**
   * 危险操作确认框
   */
  async danger(message, options = {}) {
    this.init()
    return await this.store.showConfirm({
      type: 'danger',
      title: '危险操作',
      message,
      confirmText: '删除',
      cancelText: '取消',
      ...options
    })
  }

  /**
   * 警告确认框
   */
  async warning(message, options = {}) {
    this.init()
    return await this.store.showConfirm({
      type: 'warning',
      title: '警告',
      message,
      confirmText: '继续',
      cancelText: '取消',
      ...options
    })
  }

  /**
   * 信息确认框
   */
  async info(message, options = {}) {
    this.init()
    return await this.store.showConfirm({
      type: 'info',
      title: '提示',
      message,
      confirmText: '确定',
      cancelText: '取消',
      ...options
    })
  }

  /**
   * 删除确认框
   */
  async delete(itemName = '此项目', options = {}) {
    this.init()
    return await this.store.showConfirm({
      type: 'danger',
      title: '确认删除',
      message: `确定要删除${itemName}吗？此操作无法撤销。`,
      confirmText: '删除',
      cancelText: '取消',
      ...options
    })
  }

  /**
   * 保存确认框
   */
  async save(message = '是否保存更改？', options = {}) {
    this.init()
    return await this.store.showConfirm({
      type: 'info',
      title: '保存更改',
      message,
      confirmText: '保存',
      cancelText: '不保存',
      ...options
    })
  }

  /**
   * 离开确认框
   */
  async leave(message = '您有未保存的更改，确定要离开吗？', options = {}) {
    this.init()
    return await this.store.showConfirm({
      type: 'warning',
      title: '确认离开',
      message,
      confirmText: '离开',
      cancelText: '继续编辑',
      ...options
    })
  }
}

// 创建单例实例
export const confirmService = new ConfirmService()

// 导出便捷方法
export const { confirm, danger, warning, info, delete: deleteConfirm, save, leave } = confirmService

// 为了向后兼容，也可以导出整个服务
export default confirmService