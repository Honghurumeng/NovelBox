<template>
  <div class="editor-page">
    <!-- 全局头部 -->
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
      <!-- 左侧栏 - 章节列表 -->
      <div 
        class="left-sidebar" 
        :class="{ collapsed: uiStore.leftSidebarCollapsed }"
      >
        <button 
          class="toggle-left-sidebar" 
          @click="uiStore.toggleLeftSidebar()"
        >
          {{ uiStore.leftSidebarCollapsed ? '›' : '‹' }}
        </button>
        
        <ChaptersList v-show="!uiStore.leftSidebarCollapsed" />
      </div>
      
      <!-- 主编辑区域 -->
      <div 
        class="main-content"
        :class="{
          'left-collapsed': uiStore.leftSidebarCollapsed,
          'right-collapsed': uiStore.rightSidebarCollapsed
        }"
      >
        <MainEditor @start-rewrite="handleStartRewrite" />
      </div>
      
      <!-- 右侧栏 - AI工具 -->
      <div 
        class="right-sidebar" 
        :class="{ collapsed: uiStore.rightSidebarCollapsed }"
      >
        <button 
          class="toggle-right-sidebar" 
          @click="uiStore.toggleRightSidebar()"
        >
          {{ uiStore.rightSidebarCollapsed ? '‹' : '›' }}
        </button>
        
        <AIPanel 
          v-show="!uiStore.rightSidebarCollapsed" 
          :rewrite-session="rewriteSession"
          @replace-text="handleReplaceText"
          @close-session="handleCloseSession"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNovelsStore, useChaptersStore, useUIStore } from '@/stores'
import { useI18n } from 'vue-i18n'
import ChaptersList from '@/components/editor/ChaptersList.vue'
import MainEditor from '@/components/editor/MainEditor.vue'
import AIPanel from '@/components/editor/AIPanel.vue'

export default {
  name: 'EditorPage',
  components: {
    ChaptersList,
    MainEditor,
    AIPanel
  },
  props: {
    novelId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()
    const novelsStore = useNovelsStore()
    const chaptersStore = useChaptersStore()
    const uiStore = useUIStore()
    
    // Header相关状态
    const titleInput = ref(null)
    const editingTitle = ref('')
    const hasUnsavedChanges = ref(false)
    let lastSavedContent = ''
    
    // AI重写会话管理
    const rewriteSession = ref(null)

    const init = async () => {
      // Load novels if not already loaded
      if (!novelsStore.hasNovels) {
        await novelsStore.loadNovels()
      }

      // Set current novel
      const novel = novelsStore.novels.find(n => n.id === props.novelId)
      if (!novel) {
        // Novel not found, redirect to homepage
        router.push('/')
        return
      }

      novelsStore.setCurrentNovel(props.novelId)

      // Open first chapter if available
      if (novel.chapters.length > 0) {
        await chaptersStore.openChapter(novel.chapters[0].id)
      }
    }

    const cleanup = async () => {
      // Save before leaving
      if (chaptersStore.currentChapter) {
        await novelsStore.saveNovels()
      }
      
      // Clear state
      chaptersStore.clearCurrentChapter()
      novelsStore.clearCurrentNovel()
    }

    // 处理开始重写事件
    const handleStartRewrite = (session) => {
      rewriteSession.value = session
    }

    // 处理替换文本事件
    const handleReplaceText = (replaceData) => {
      if (chaptersStore.currentChapter) {
        const currentContent = chaptersStore.currentChapter.content
        const newContent = 
          currentContent.substring(0, replaceData.selectionStart) +
          replaceData.newText +
          currentContent.substring(replaceData.selectionEnd)
        
        chaptersStore.updateChapterContent(newContent)
      }
    }

    // Header相关方法
    const goToHomepage = async () => {
      if (chaptersStore.currentChapter) {
        await novelsStore.saveNovels()
      }
      
      chaptersStore.clearCurrentChapter()
      novelsStore.clearCurrentNovel()
      router.push('/')
    }

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

    const startEditingTitle = () => {
      if (!chaptersStore.currentChapter) return
      
      editingTitle.value = chaptersStore.currentChapter.title
      uiStore.startEditingChapterTitle()
      
      nextTick(() => {
        titleInput.value?.focus()
        titleInput.value?.select()
      })
    }

    const finishEditingTitle = async () => {
      if (!chaptersStore.currentChapter) return
      
      const newTitle = editingTitle.value.trim()
      if (newTitle && newTitle !== chaptersStore.currentChapter.title) {
        try {
          await chaptersStore.updateChapterTitle(chaptersStore.currentChapter.id, newTitle)
          lastSavedContent = chaptersStore.currentChapter.content
          hasUnsavedChanges.value = false
        } catch (error) {
          alert('更新标题失败: ' + error.message)
        }
      }
      
      uiStore.stopEditingChapterTitle()
    }

    const cancelEditingTitle = () => {
      uiStore.stopEditingChapterTitle()
      editingTitle.value = ''
    }

    // 处理关闭重写会话事件
    const handleCloseSession = () => {
      rewriteSession.value = null
    }

    // 监听章节变化
    const handleChapterChange = () => {
      if (chaptersStore.currentChapter) {
        lastSavedContent = chaptersStore.currentChapter.content
        hasUnsavedChanges.value = false
      }
    }

    // 监听自动保存事件
    const handleAutoSave = () => {
      if (chaptersStore.currentChapter) {
        lastSavedContent = chaptersStore.currentChapter.content
        hasUnsavedChanges.value = false
      }
    }

    // 监听章节内容变化
    const handleContentChange = () => {
      if (chaptersStore.currentChapterContent !== lastSavedContent) {
        hasUnsavedChanges.value = true
      }
    }

    onMounted(() => {
      init()
      // 监听章节变化
      chaptersStore.$subscribe((mutation, state) => {
        if (mutation.type === 'chapters' && mutation.payload?.type === 'AUTO_SAVE_COMPLETED') {
          handleAutoSave()
        }
      })
      // 监听章节内容变化
      watch(() => chaptersStore.currentChapterContent, handleContentChange)
      // 监听当前章节变化
      watch(() => chaptersStore.currentChapter, handleChapterChange)
    })

    onUnmounted(() => {
      cleanup()
    })

    return {
      novelsStore,
      chaptersStore,
      uiStore,
      rewriteSession,
      titleInput,
      editingTitle,
      hasUnsavedChanges,
      goToHomepage,
      manualSave,
      startEditingTitle,
      finishEditingTitle,
      cancelEditingTitle,
      handleStartRewrite,
      handleReplaceText,
      handleCloseSession
    }
  }
}
</script>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-color);
  overflow: hidden;
}

/* 全局头部样式 */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--sidebar-bg);
  min-height: 50px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 200;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
}

.back-btn {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

.back-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.back-btn:hover::before {
  left: 100%;
}

.back-btn:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.back-btn:active {
  transform: translateY(0);
}

.current-novel-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1.1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-header-center {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
  padding: 0 20px;
}

.chapter-title-editor {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 500px;
  width: 100%;
}

.chapter-title-input {
  flex: 1;
  padding: 6px 12px;
  border: 2px solid var(--accent-color);
  border-radius: 6px;
  font-size: 1em;
  font-weight: 500;
  text-align: center;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.chapter-title-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-shadow);
  border-color: var(--accent-color);
}

.chapter-title-display {
  flex: 1;
  font-size: 1.05em;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-title-display:hover {
  background: var(--nav-hover-bg);
  color: var(--accent-color);
  border-color: var(--accent-color);
  transform: translateY(-1px);
}

.unsaved-indicator {
  font-size: 0.8em;
  color: var(--text-secondary);
  font-style: italic;
  margin-left: 8px;
  vertical-align: middle;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.editor-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.auto-save-indicator {
  font-size: 0.9em;
  color: #28a745;
  font-weight: 500;
  animation: fadeInOut 2s ease-in-out;
  white-space: nowrap;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.save-btn {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-color);
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

.save-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.save-btn:hover::before {
  left: 100%;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--accent-shadow);
}

.save-btn:active {
  transform: translateY(0);
}

/* 编辑器内容区域 */
.editor-content {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
}

/* 左侧边栏样式 */
.left-sidebar {
  position: relative;
  width: 300px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  z-index: 100;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.left-sidebar.collapsed {
  width: 50px;
}

.toggle-left-sidebar {
  position: absolute;
  top: 50%;
  right: -10px;
  transform: translateY(-50%);
  width: 24px;
  height: 40px;
  background: var(--btn-primary-bg);
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 101;
  transition: all 0.2s;
}

.toggle-left-sidebar:hover {
  opacity: 0.9;
}

/* 右侧边栏样式 */
.right-sidebar {
  position: relative;
  width: 350px;
  background: var(--sidebar-bg);
  border-left: 1px solid var(--border-color);
  z-index: 100;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.right-sidebar.collapsed {
  width: 50px;
}

.toggle-right-sidebar {
  position: absolute;
  top: 50%;
  left: -10px;
  transform: translateY(-50%);
  width: 24px;
  height: 40px;
  background: var(--btn-primary-bg);
  color: white;
  border: none;
  border-radius: 4px 0 0 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 101;
  transition: all 0.2s;
}

.toggle-right-sidebar:hover {
  opacity: 0.9;
}

/* 主编辑区域样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-content.left-collapsed {
  margin-left: 50px;
}

.main-content.right-collapsed {
  margin-right: 50px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    padding: 12px 16px;
    min-height: 60px;
  }
  
  .editor-header-left {
    gap: 12px;
  }
  
  .back-btn {
    padding: 8px 12px;
    font-size: 0.8em;
  }
  
  .current-novel-title {
    font-size: 1em;
  }
  
  .chapter-title-editor {
    max-width: 300px;
    gap: 8px;
  }
  
  .chapter-title-display {
    font-size: 1em;
    padding: 8px 12px;
  }
  
  .save-btn {
    padding: 8px 16px;
    font-size: 0.8em;
  }
  
  .left-sidebar {
    width: 250px;
  }
  
  .right-sidebar {
    width: 300px;
  }
}

@media (max-width: 480px) {
  .editor-header {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    min-height: auto;
  }
  
  .editor-header-left,
  .editor-header-right {
    justify-content: center;
  }
  
  .current-novel-title {
    font-size: 0.9em;
    max-width: 200px;
  }
  
  .chapter-title-editor {
    max-width: 250px;
  }
  
  .unsaved-indicator {
    display: none;
  }
}
</style>
