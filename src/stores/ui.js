import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    // Modal states
    showNewNovelModal: false,
    showEditNovelModal: false,
    editNovelData: null,
    
    // Sidebar states
    leftSidebarCollapsed: false,
    rightSidebarCollapsed: true,
    
    // Edit states
    editingChapterTitle: false,
    
    // Save indicator
    showSaveIndicator: false,
    saveIndicatorMessage: '已自动保存',
    
    // Storage path
    storagePath: '加载中...'
  }),

  actions: {
    // Modal actions
    openNewNovelModal() {
      this.showNewNovelModal = true
    },

    closeNewNovelModal() {
      this.showNewNovelModal = false
    },

    openEditNovelModal() {
      this.showEditNovelModal = true
    },

    closeEditNovelModal() {
      this.showEditNovelModal = false
    },

    // Sidebar actions
    toggleLeftSidebar() {
      this.leftSidebarCollapsed = !this.leftSidebarCollapsed
    },

    toggleRightSidebar() {
      this.rightSidebarCollapsed = !this.rightSidebarCollapsed
    },

    collapseLeftSidebar() {
      this.leftSidebarCollapsed = true
    },

    expandLeftSidebar() {
      this.leftSidebarCollapsed = false
    },

    collapseRightSidebar() {
      this.rightSidebarCollapsed = true
    },

    expandRightSidebar() {
      this.rightSidebarCollapsed = false
    },

    // Chapter title editing
    startEditingChapterTitle() {
      this.editingChapterTitle = true
    },

    stopEditingChapterTitle() {
      this.editingChapterTitle = false
    },

    // Save indicator
    showSaveMessage(message = '已自动保存') {
      this.saveIndicatorMessage = message
      this.showSaveIndicator = true
      
      setTimeout(() => {
        this.showSaveIndicator = false
      }, 2000)
    },

    // Storage path
    async updateStoragePath() {
      try {
        const currentPath = await window.electronAPI.storage.getCurrentPath()
        this.storagePath = currentPath
      } catch (error) {
        console.error('获取存储路径失败:', error)
        this.storagePath = '获取失败'
      }
    },

    async selectStorageDirectory() {
      try {
        const selectedPath = await window.electronAPI.storage.selectDirectory()
        if (selectedPath) {
          await this.updateStoragePath()
          return selectedPath
        }
      } catch (error) {
        console.error('选择存储目录失败:', error)
        throw error
      }
    },

    async resetStorageDirectory() {
      try {
        const defaultPath = await window.electronAPI.storage.resetToDefault()
        await this.updateStoragePath()
        return defaultPath
      } catch (error) {
        console.error('重置存储目录失败:', error)
        throw error
      }
    }
  }
})