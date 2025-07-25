<template>
  <div class="main-editor">
    <div class="editor-header">
      <div class="editor-header-left">
        <button class="back-btn" @click="goToHomepage">
          ← 返回主页
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
            placeholder="章节标题"
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
            {{ chaptersStore.currentChapterTitle || '请选择章节' }}
          </span>
          <span v-if="hasUnsavedChanges" class="unsaved-indicator">未保存</span>
        </div>
      </div>
      
      <div class="editor-header-right">
        <span 
          v-show="uiStore.showSaveIndicator" 
          class="auto-save-indicator"
        >
          {{ uiStore.saveIndicatorMessage }}
        </span>
        <button class="save-btn" @click="manualSave" title="手动保存">
          💾 保存
        </button>
      </div>
    </div>
    
    <div class="editor-content">
      <textarea 
        v-model="editorContent"
        class="chapter-editor" 
        placeholder="开始写作..."
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

export default {
  name: 'MainEditor',
  setup() {
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
        uiStore.showSaveMessage('手动保存成功')
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

    // 添加键盘事件监听
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        manualSave()
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown)
      // 初始化自动保存定时器
      if (chaptersStore.currentChapter) {
        chaptersStore.startAutoSave()
      }
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
  background: white;
}

.editor-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e1e8ed;
  background: #f8f9fa;
  min-height: 70px;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.back-btn {
  background: none;
  border: 1px solid #d0d7de;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  color: #586069;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn:hover {
  background: #f6f8fa;
  border-color: #c4c9ce;
  color: #24292f;
}

.current-novel-title {
  font-weight: 600;
  color: #333;
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
  background: #667eea;
  border-radius: 1px;
}

.chapter-title-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #667eea;
  border-radius: 6px;
  font-size: 1.1em;
  font-weight: 500;
  text-align: center;
  background: white;
}

.chapter-title-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chapter-title-display {
  flex: 1;
  font-size: 1.2em;
  font-weight: 600;
  color: #333;
  text-align: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.chapter-title-display:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.unsaved-indicator {
  font-size: 0.8em;
  color: #6c757d;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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
  color: #333;
  background: transparent;
  resize: none;
  padding: 0;
}

.chapter-editor::placeholder {
  color: #999;
  font-style: italic;
}

/* 自定义滚动条 */
.chapter-editor::-webkit-scrollbar {
  width: 8px;
}

.chapter-editor::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.chapter-editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.chapter-editor::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>