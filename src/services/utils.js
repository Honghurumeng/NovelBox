/**
 * Utility functions for the application
 */

export class UtilsService {
  /**
   * HTML转义，防止XSS攻击
   */
  static escapeHtml(text) {
    if (!text) return ''
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  /**
   * 格式化字数
   */
  static formatWordCount(count) {
    if (count === 0) return '0 字'
    if (count < 1000) return `${count} 字`
    if (count < 10000) return `${(count / 1000).toFixed(1)}k 字`
    return `${(count / 10000).toFixed(1)}万 字`
  }

  /**
   * 格式化日期
   */
  static formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    // 小于1分钟
    if (diff < 60000) return '刚刚'
    
    // 小于1小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}分钟前`
    }
    
    // 小于1天
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}小时前`
    }
    
    // 小于7天
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days}天前`
    }
    
    // 超过7天，显示具体日期
    return date.toLocaleDateString('zh-CN')
  }

  /**
   * 生成唯一ID
   */
  static generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 深拷贝对象
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    if (typeof obj === 'object') {
      const clonedObj = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key])
        }
      }
      return clonedObj
    }
  }

  /**
   * 防抖函数
   */
  static debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  /**
   * 验证小说数据
   */
  static validateNovelData(data) {
    const errors = []
    
    if (!data.name || !data.name.trim()) {
      errors.push('小说名称不能为空')
    } else if (data.name.trim().length > 100) {
      errors.push('小说名称不能超过100个字符')
    }
    
    if (!data.author || !data.author.trim()) {
      errors.push('作者名称不能为空')
    } else if (data.author.trim().length > 50) {
      errors.push('作者名称不能超过50个字符')
    }
    
    if (data.description && data.description.length > 500) {
      errors.push('简介不能超过500个字符')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}