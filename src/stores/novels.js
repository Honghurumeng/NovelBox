import { defineStore } from 'pinia'
import i18n from '@/locales/i18n'
 const t = i18n.global.t

export const useNovelsStore = defineStore('novels', {
  state: () => ({
    novels: [],
    currentNovel: null,
    loading: false,
    error: null
  }),

  getters: {
    novelsCount: (state) => state.novels.length,
    hasNovels: (state) => state.novels.length > 0,
    currentNovelTitle: (state) => state.currentNovel?.name || '',
  },

  actions: {
    async loadNovels() {
      this.loading = true
      this.error = null
      
      try {
        const result = await window.electronAPI.storage.loadNovels()
        if (result.success) {
          this.novels = result.data || []
        } else {
          this.error = result.error
          console.error('加载小说数据失败:', result.error)
          this.novels = []
        }
      } catch (error) {
        this.error = error.message
        console.error('加载小说数据异常:', error)
        this.novels = []
      } finally {
        this.loading = false
      }
    },

    async saveNovels() {
      try {
        // Create a clean copy without circular references for IPC
        const cleanNovels = JSON.parse(JSON.stringify(this.novels))
        const result = await window.electronAPI.storage.saveNovels(cleanNovels)
        if (!result.success) {
          this.error = result.error
          console.error('保存小说数据失败:', result.error)
          throw new Error(result.error)
        }
      } catch (error) {
        this.error = error.message
        console.error('保存小说数据异常:', error)
        throw error
      }
    },

    async createNovel(novelData) {
      const novel = {
        id: Date.now().toString(),
        name: novelData.name,
        author: novelData.author,
        description: novelData.description,
        cover: null,
        chapters: [{
          id: Date.now().toString(),
          title: t('chapters.newChapterTitle', { number: 1 }),
          content: '',
          wordCount: 0
        }],
        createdAt: new Date().toISOString()
      }

      this.novels.push(novel)
      await this.saveNovels()
      return novel
    },

    async updateNovel(novelId, updates) {
      const novel = this.novels.find(n => n.id === novelId)
      if (!novel) return false

      Object.assign(novel, updates)
      await this.saveNovels()
      
      // Update current novel if it's the one being edited
      if (this.currentNovel && this.currentNovel.id === novelId) {
        this.currentNovel = novel
      }
      
      return true
    },

    async deleteNovel(novelId) {
      const novelIndex = this.novels.findIndex(n => n.id === novelId)
      if (novelIndex === -1) return false

      this.novels.splice(novelIndex, 1)
      await this.saveNovels()
      
      // Clear current novel if it was deleted
      if (this.currentNovel && this.currentNovel.id === novelId) {
        this.currentNovel = null
      }
      
      return true
    },

    setCurrentNovel(novelId) {
      this.currentNovel = this.novels.find(n => n.id === novelId) || null
    },

    clearCurrentNovel() {
      this.currentNovel = null
    }
  }
})