<template>
  <div class="main-editor">
    <div class="editor-header">
      <div class="editor-header-left">
        <button class="back-btn" @click="goToHomepage">
          {{ $t('editor.backToHomepage') }}
        </button>
        <span class="current-novel-title">
          {{ novelsStore.currentNovelTitle }}
        </span>
      </div>
      
      <div class="editor-header-center">
        <div class="chapter-title-editor">
          <div class="chapter-title-divider"></div>
          <input 
            v-if="uiStore.editingChapterTitle"
            type="text" 
            v-model="editingTitle"
            class="chapter-title-input"
            :placeholder="$t('editor.chapterTitlePlaceholder')"
            @blur="finishEditingTitle"
            @keydown.enter="finishEditingTitle"
            @keydown.esc="cancelEditingTitle"
            ref="titleInput"
          >
          <span 
            v-else
            class="chapter-title-display"
            @click="startEditingTitle"
          >
            {{ chaptersStore.currentChapterTitle || $t('chapters.untitled') }}
          </span>
          <span v-if="hasUnsavedChanges" class="unsaved-indicator">{{ $t('editor.unsavedChanges') }}</span>
        </div>
      </div>
      
      <div class="editor-header-right">
        <span 
          v-show="uiStore.showSaveIndicator" 
          class="auto-save-indicator"
        >
          {{ uiStore.saveIndicatorMessage }}
        </span>
        <button class="save-btn" @click="manualSave" :title="$t('common.save')">
          💾 {{ $t('common.save') }}
        </button>
      </div>
    </div>
    
    <div class="editor-content">
      <textarea 
        v-model="editorContent"
        class="chapter-editor" 
        :placeholder="$t('editor.startWriting')"
        @input="handleEditorInput"
        @keydown.ctrl.s.prevent="manualSave"
      ></textarea>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelsStore, useChaptersStore, useUIStore } from '@/stores'
import { useI18n } from 'vue-i18n'

export default {
  name: 'MainEditor',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const novelsStore = useNovelsStore()
    const chaptersStore = useChaptersStore()
    const uiStore = useUIStore()
    
    const titleInput = ref(null)
    const editingTitle = ref('')
    const hasUnsavedChanges = ref(false)
    let lastSavedContent = ''
    
    const editorContent = computed({
      get: () => chaptersStore.currentChapterContent,
      set: (value) => {
        chaptersStore.updateChapterContent(value)
        hasUnsavedChanges.value = value !== lastSavedContent
      }
    })

    // 返回主页
    const goToHomepage = async () => {
      if (chaptersStore.currentChapter) {
        await novelsStore.saveNovels()
      }
      
      chaptersStore.clearCurrentChapter()
      novelsStore.clearCurrentNovel()
      router.push('/')
    }

    // 手动保存
    const manualSave = async () => {
      if (!novelsStore.currentNovel) return
      
      try {
        await novelsStore.saveNovels()
        lastSavedContent = chaptersStore.currentChapterContent
        hasUnsavedChanges.value = false
        uiStore.showSaveMessage(t('editor.manualSaveSuccess'))
      } catch (error) {
        console.error('手动保存失败:', error)
        alert('保存失败: ' + error.message)
      }
    }

    // 处理编辑器输入
    const handleEditorInput = () => {
      // Content is automatically updated via v-model
      // Word count is updated in the store
    }

    // 开始编辑章节标题
    const startEditingTitle = () => {
      if (!chaptersStore.currentChapter) return
      
      editingTitle.value = chaptersStore.currentChapter.title
      uiStore.startEditingChapterTitle()
      
      nextTick(() => {
        titleInput.value?.focus()
        titleInput.value?.select()
      })
    }

    // 完成编辑章节标题
    const finishEditingTitle = async () => {
      if (!chaptersStore.currentChapter) return
      
      const newTitle = editingTitle.value.trim()
      if (newTitle && newTitle !== chaptersStore.currentChapter.title) {
        try {
          await chaptersStore.updateChapterTitle(chaptersStore.currentChapter.id, newTitle)
          // 更新保存状态
          lastSavedContent = chaptersStore.currentChapter.content
          hasUnsavedChanges.value = false
        } catch (error) {
          alert('更新标题失败: ' + error.message)
        }
      }
      
      uiStore.stopEditingChapterTitle()
    }

    // 取消编辑章节标题
    const cancelEditingTitle = () => {
      uiStore.stopEditingChapterTitle()
      editingTitle.value = ''
    }

    // 监听当前章节变化，更新编辑器内容
    watch(() => chaptersStore.currentChapter, (newChapter) => {
      if (newChapter) {
        // Content is automatically updated via computed property
        lastSavedContent = newChapter.content
        hasUnsavedChanges.value = false
      }
    })
    
    // 监听自动保存事件，更新保存状态
    const handleAutoSave = () => {
      if (chaptersStore.currentChapter) {
        lastSavedContent = chaptersStore.currentChapter.content
        hasUnsavedChanges.value = false
      }
    }
    
    // 监听章节内容变化
    watch(() => chaptersStore.currentChapterContent, (newContent) => {
      if (newContent !== undefined && newContent !== lastSavedContent) {
        hasUnsavedChanges.value = true
      }
    })

    // 添加键盘事件监听
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        manualSave()
      }
    }

    // 初始化自动保存定时器
    const initAutoSave = () => {
      if (chaptersStore.currentChapter) {
        chaptersStore.startAutoSave()
      }
    }

    const autoSaveCallback = async () => {
      hasUnsavedChanges.value = false
    }

    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown)
      chaptersStore.addAutoSaveCallback(autoSaveCallback)
      // 监听自动保存完成事件
      chaptersStore.$subscribe((mutation, state) => {
        // 当章节内容发生变化时，检查是否需要更新保存状态
        if (mutation.type === 'chapters' && mutation.payload?.type === 'AUTO_SAVE_COMPLETED') {
          handleAutoSave()
        }
      })
      // 初始化自动保存定时器
      initAutoSave()
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
      chaptersStore.clearAutoSaveTimer()
    })

    return {
      novelsStore,
      chaptersStore,
      uiStore,
      titleInput,
      editingTitle,
      editorContent,
      hasUnsavedChanges,
      goToHomepage,
      manualSave,
      handleEditorInput,
      startEditingTitle,
      finishEditingTitle,
      cancelEditingTitle
    }
  }
}
</script>

<style scoped>
.main-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--content-bg);
}

.editor-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--sidebar-bg);
  min-height: 70px;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.back-btn {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
}

.current-novel-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1.1em;
}

.editor-header-center {
  flex: 2;
  display: flex;
  justify-content: center;
}

.chapter-title-editor {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 400px;
  width: 100%;
}

.chapter-title-divider {
  width: 40px;
  height: 2px;
  background: var(--accent-color);
  border-radius: 1px;
}

.chapter-title-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid var(--accent-color);
  border-radius: 6px;
  font-size: 1.1em;
  font-weight: 500;
  text-align: center;
  background: var(--input-bg);
  color: var(--text-primary);
}

.chapter-title-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-shadow);
}

.chapter-title-display {
  flex: 1;
  font-size: 1.2em;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.chapter-title-display:hover {
  background: var(--nav-hover-bg);
  color: var(--accent-color);
}

.unsaved-indicator {
  font-size: 0.8em;
  color: var(--text-secondary);
  font-style: italic;
  margin-left: 10px;
  vertical-align: middle;
}

.editor-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: flex-end;
}

.auto-save-indicator {
  font-size: 0.9em;
  color: #28a745;
  font-weight: 500;
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.save-btn {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-color);
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--accent-shadow);
}

.editor-content {
  flex: 1;
  padding: 24px;
  overflow: hidden;
}

.chapter-editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  background: transparent;
  resize: none;
  padding: 0;
}

.chapter-editor::placeholder {
  color: var(--text-secondary);
  font-style: italic;
}

/* 自定义滚动条 */
.chapter-editor::-webkit-scrollbar {
  width: 8px;
}

.chapter-editor::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.chapter-editor::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.chapter-editor::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 在深色和OLED主题中调整滚动条样式 */
.theme-dark .chapter-editor::-webkit-scrollbar-track,
.theme-oled .chapter-editor::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.theme-dark .chapter-editor::-webkit-scrollbar-thumb,
.theme-oled .chapter-editor::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.theme-dark .chapter-editor::-webkit-scrollbar-thumb:hover,
.theme-oled .chapter-editor::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>