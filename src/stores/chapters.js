import { defineStore } from 'pinia'
import { useNovelsStore } from './novels'
import { useUIStore } from './ui'
import i18n from '@/locales/i18n'

const t = i18n.global.t
export const useChaptersStore = defineStore('chapters', {
  state: () => ({
    currentChapter: null,
    autoSaveTimer: null,
    draggedChapterId: null,
    autoSaveCallback: null,
    pendingSave: false,
    lastSaveTime: null
  }),

  getters: {
    chapters: () => {
      const novelsStore = useNovelsStore()
      return novelsStore.currentNovel?.chapters || []
    },
    
    currentChapterTitle: (state) => state.currentChapter?.title || '',
    currentChapterContent: (state) => state.currentChapter?.content || '',
    currentChapterWordCount: (state) => state.currentChapter?.wordCount || 0,
    
    hasChapters() {
      return this.chapters.length > 0
    }
  },

  actions: {

    async addAutoSaveCallback(callback) {
      this.autoSaveCallback = callback
    },


    async openChapter(chapterId) {
      const novelsStore = useNovelsStore()
      const uiStore = useUIStore()
      
      // Save current chapter before switching
      if (this.currentChapter) {
        await novelsStore.saveNovels()

        uiStore.showSaveMessage(t('editor.autoSaveIndicator'))
      }

      const chapter = this.chapters.find(c => c.id === chapterId)
      if (chapter) {
        this.currentChapter = chapter
        this.startAutoSave()
      }
    },

    async addNewChapter() {
      const novelsStore = useNovelsStore()
      const uiStore = useUIStore()
      if (!novelsStore.currentNovel) return null

      const chapterNumber = novelsStore.currentNovel.chapters.length + 1
      const newChapter = {
        id: Date.now().toString(),
        title: t('chapters.newChapterTitle', { number: chapterNumber }),
        content: '',
        wordCount: 0
      }

      novelsStore.currentNovel.chapters.push(newChapter)
      await novelsStore.saveNovels()
      uiStore.showSaveMessage(t('chapters.created'))
      
      return newChapter
    },

    async deleteChapter(chapterId) {
      const novelsStore = useNovelsStore()
      const uiStore = useUIStore()
      if (!novelsStore.currentNovel) return false

      if (novelsStore.currentNovel.chapters.length <= 1) {
        throw new Error(t('chapters.atLeastOneChapter'))
      }

      const chapterIndex = novelsStore.currentNovel.chapters.findIndex(c => c.id === chapterId)
      if (chapterIndex === -1) return false

      novelsStore.currentNovel.chapters.splice(chapterIndex, 1)

      // If deleting current chapter, switch to first chapter
      if (this.currentChapter && this.currentChapter.id === chapterId) {
        this.currentChapter = novelsStore.currentNovel.chapters[0]
      }

      await novelsStore.saveNovels()
      uiStore.showSaveMessage(t('chapters.deleted'))
      return true
    },

    async updateChapterTitle(chapterId, newTitle) {
      const novelsStore = useNovelsStore()
      const uiStore = useUIStore()
      const chapter = this.chapters.find(c => c.id === chapterId)
      
      if (!chapter || !newTitle.trim()) return false

      chapter.title = newTitle.trim()
      await novelsStore.saveNovels()
      uiStore.showSaveMessage(t('chapters.titleUpdated'))
      return true
    },

    updateChapterContent(content) {
      if (!this.currentChapter) return

      this.currentChapter.content = content
      this.currentChapter.wordCount = content.length
      
      // 防抖保存：只有在内容真正变化时才触发保存
      this.debouncedSave()
    },

    // 防抖保存函数
    debouncedSave() {
      if (this.pendingSave) return
      
      this.pendingSave = true
      clearTimeout(this.autoSaveTimer)
      
      this.autoSaveTimer = setTimeout(async () => {
        if (this.currentChapter) {
          const novelsStore = useNovelsStore()
          const uiStore = useUIStore()
          
          try {
            await novelsStore.saveNovels()
            this.lastSaveTime = new Date()
            uiStore.showSaveMessage(t('editor.autoSaveIndicator'))
            
            if (this.autoSaveCallback) {
              await this.autoSaveCallback()
            }
          } catch (error) {
            console.error('自动保存失败:', error)
            uiStore.showSaveMessage(t('editor.autoSaveFailed'))
          } finally {
            this.pendingSave = false
          }
        }
      }, 2000) // 2秒防抖延迟
    },

    async reorderChapters(draggedChapterId, targetChapterId, position) {
      const novelsStore = useNovelsStore()
      const uiStore = useUIStore()
      if (!novelsStore.currentNovel) return false

      const chapters = novelsStore.currentNovel.chapters
      const draggedIndex = chapters.findIndex(c => c.id === draggedChapterId)
      let targetIndex = chapters.findIndex(c => c.id === targetChapterId)

      if (draggedIndex === -1 || targetIndex === -1) return false

      const [draggedItem] = chapters.splice(draggedIndex, 1)
      
      // Recalculate target index after removal
      targetIndex = chapters.findIndex(c => c.id === targetChapterId)
      
      if (position === 'before') {
        chapters.splice(targetIndex, 0, draggedItem)
      } else {
        chapters.splice(targetIndex + 1, 0, draggedItem)
      }

      await novelsStore.saveNovels()
      uiStore.showSaveMessage(t('chapters.reordered'))
      return true
    },

    startAutoSave() {
      const uiStore = useUIStore()
      this.clearAutoSaveTimer()
      
      // 改为每30秒检查一次是否有未保存的更改
      this.autoSaveTimer = setInterval(async () => {
        if (this.currentChapter && !this.pendingSave) {
          const novelsStore = useNovelsStore()
          
          try {
            await novelsStore.saveNovels()
            this.lastSaveTime = new Date()
            uiStore.showSaveMessage(t('editor.autoSaveIndicator'))
            
            if (this.autoSaveCallback) {
              await this.autoSaveCallback()
            }
          } catch (error) {
            console.error('自动保存失败:', error)
            uiStore.showSaveMessage(t('editor.autoSaveFailed'))
          }
        }
      }, 30000) // 30秒检查一次
    },

    clearAutoSaveTimer() {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer)
        clearTimeout(this.autoSaveTimer)
        this.autoSaveTimer = null
      }
    },

    clearCurrentChapter() {
      this.clearAutoSaveTimer()
      this.currentChapter = null
      this.pendingSave = false
      this.lastSaveTime = null
    },

    // Drag and drop state management
    setDraggedChapter(chapterId) {
      this.draggedChapterId = chapterId
    },

    clearDraggedChapter() {
      this.draggedChapterId = null
    }
  }
})