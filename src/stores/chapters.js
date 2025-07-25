import { defineStore } from 'pinia'
import { useNovelsStore } from './novels'
import { useUIStore } from './ui'

export const useChaptersStore = defineStore('chapters', {
  state: () => ({
    currentChapter: null,
    autoSaveTimer: null,
    draggedChapterId: null
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
    async openChapter(chapterId) {
      const novelsStore = useNovelsStore()
      const uiStore = useUIStore()
      
      // Save current chapter before switching
      if (this.currentChapter) {
        await novelsStore.saveNovels()
        uiStore.showSaveMessage('已自动保存')
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
        title: `第${chapterNumber}章`,
        content: '',
        wordCount: 0
      }

      novelsStore.currentNovel.chapters.push(newChapter)
      await novelsStore.saveNovels()
      uiStore.showSaveMessage('章节已创建')
      
      return newChapter
    },

    async deleteChapter(chapterId) {
      const novelsStore = useNovelsStore()
      const uiStore = useUIStore()
      if (!novelsStore.currentNovel) return false

      if (novelsStore.currentNovel.chapters.length <= 1) {
        throw new Error('至少需要保留一个章节')
      }

      const chapterIndex = novelsStore.currentNovel.chapters.findIndex(c => c.id === chapterId)
      if (chapterIndex === -1) return false

      novelsStore.currentNovel.chapters.splice(chapterIndex, 1)

      // If deleting current chapter, switch to first chapter
      if (this.currentChapter && this.currentChapter.id === chapterId) {
        this.currentChapter = novelsStore.currentNovel.chapters[0]
      }

      await novelsStore.saveNovels()
      uiStore.showSaveMessage('章节已删除')
      return true
    },

    async updateChapterTitle(chapterId, newTitle) {
      const novelsStore = useNovelsStore()
      const uiStore = useUIStore()
      const chapter = this.chapters.find(c => c.id === chapterId)
      
      if (!chapter || !newTitle.trim()) return false

      chapter.title = newTitle.trim()
      await novelsStore.saveNovels()
      uiStore.showSaveMessage('标题已更新')
      return true
    },

    updateChapterContent(content) {
      if (!this.currentChapter) return

      this.currentChapter.content = content
      this.currentChapter.wordCount = content.length
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
      uiStore.showSaveMessage('章节顺序已更新')
      return true
    },

    startAutoSave() {
      const uiStore = useUIStore()
      this.clearAutoSaveTimer()
      this.autoSaveTimer = setInterval(async () => {
        if (this.currentChapter) {
          const novelsStore = useNovelsStore()
          await novelsStore.saveNovels()
          uiStore.showSaveMessage('已自动保存')
        }
      }, 5000)
    },

    clearAutoSaveTimer() {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer)
        this.autoSaveTimer = null
      }
    },

    clearCurrentChapter() {
      this.clearAutoSaveTimer()
      this.currentChapter = null
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