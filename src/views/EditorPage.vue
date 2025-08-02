<template>
  <div class="editor-page">
    <!-- 全局头部 -->
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
            {{ chaptersStore.currentChapterTitle || '未命名章节' }}
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
        <button class="save-btn" @click="manualSave" title="保存">
          保存
        </button>
      </div>
    </div>
    
    <div class="editor-content">
      <!-- 左侧栏 - 章节列表 -->
      <div 
        class="left-sidebar" 
        :class="{ collapsed: uiStore.leftSidebarCollapsed }"
      >
        <ChaptersList />
      </div>
      
      <!-- 主编辑区域 -->
      <div 
        class="main-content"
        :class="{
          'left-collapsed': uiStore.leftSidebarCollapsed,
          'right-collapsed': uiStore.rightSidebarCollapsed
        }"
      >
        <MainEditor 
          ref="mainEditorRef"
          @start-rewrite="handleStartRewrite"
          @selected-text-change="handleSelectedTextChange"
        />
      </div>
      
      <!-- 右侧栏 - AI工具 -->
      <div 
        class="right-sidebar" 
        :class="{ collapsed: uiStore.rightSidebarCollapsed }"
      >
        <AIPanel 
          :rewrite-session="rewriteSession"
          :selected-text="selectedText"
          @replace-text="handleReplaceText"
          @insert-text="handleInsertText"
          @close-session="handleCloseSession"
          @rewrite="handleRewriteFromPanel"
          @story-background="handleStoryBackground"
          @character-info="handleCharacterInfo"
          @outline-generate="handleOutlineGenerate"
          @chapter-list="handleChapterList"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNovelsStore, useChaptersStore, useUIStore } from '@/stores'
import { notificationService } from '@/services'
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
    const novelsStore = useNovelsStore()
    const chaptersStore = useChaptersStore()
    const uiStore = useUIStore()
    
    // Header相关状态
    const titleInput = ref(null)
    const mainEditorRef = ref(null)
    const editingTitle = ref('')
    const hasUnsavedChanges = ref(false)
    let lastSavedContent = ''
    
    // AI重写会话管理
    const rewriteSession = ref(null)
    const selectedText = ref('')
    const selectionRange = ref({ start: 0, end: 0 })

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
    
    // 处理选中文本变化
    const handleSelectedTextChange = (selectionData) => {
      if (typeof selectionData === 'string') {
        // 兼容旧格式
        selectedText.value = selectionData
        selectionRange.value = { start: 0, end: selectionData.length }
      } else {
        // 新格式
        selectedText.value = selectionData.text
        selectionRange.value = { start: selectionData.start, end: selectionData.end }
      }
    }
    
    // 处理从AIPanel发起的重写请求
    const handleRewriteFromPanel = (type, customPrompt = '') => {
      if (!selectedText.value) return
      
      // 创建重写会话
      const session = {
        type,
        originalText: selectedText.value,
        customPrompt: customPrompt, // 添加自定义提示
        selectionStart: selectionRange.value.start,
        selectionEnd: selectionRange.value.end
      }
      
      handleStartRewrite(session)
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

    // 处理插入文本事件
    const handleInsertText = (insertData) => {
      if (chaptersStore.currentChapter && mainEditorRef.value) {
        // 获取当前光标位置
        const cursorPosition = mainEditorRef.value.getCurrentCursorPosition()
        const currentContent = chaptersStore.currentChapter.content
        
        // 在光标位置插入新文本
        const newContent = 
          currentContent.substring(0, cursorPosition) +
          insertData.newText +
          currentContent.substring(cursorPosition)
        
        chaptersStore.updateChapterContent(newContent)
        
        // 设置光标到插入文本的末尾
        const newCursorPosition = cursorPosition + insertData.newText.length
        nextTick(() => {
          mainEditorRef.value.setCursorPosition(newCursorPosition)
        })
      }
    }
    
    // AI创作辅助功能处理方法
    const handleStoryBackground = () => {
      // 故事背景生成功能
      console.log('故事背景生成功能')
      notificationService.info('故事背景生成功能开发中...')
    }
    
    const handleCharacterInfo = () => {
      // 人物信息生成功能
      console.log('人物信息生成功能')
      notificationService.info('人物信息生成功能开发中...')
    }
    
    const handleOutlineGenerate = () => {
      // 大纲生成功能
      console.log('大纲生成功能')
      notificationService.info('大纲生成功能开发中...')
    }
    
    const handleChapterList = () => {
      // 章节列表生成功能
      console.log('章节列表生成功能')
      notificationService.info('章节列表生成功能开发中...')
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
        uiStore.showSaveMessage('手动保存成功')
      } catch (error) {
        console.error('手动保存失败:', error)
        notificationService.error('保存失败: ' + error.message)
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
          notificationService.error('更新标题失败: ' + error.message)
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
      // 状态管理
      novelsStore,
      chaptersStore,
      uiStore,
      
      // AI相关状态
      rewriteSession,
      selectedText,
      selectionRange,
      
      // 头部相关状态
      titleInput,
      mainEditorRef,
      editingTitle,
      hasUnsavedChanges,
      
      // 导航和保存方法
      goToHomepage,
      manualSave,
      
      // 标题编辑方法
      startEditingTitle,
      finishEditingTitle,
      cancelEditingTitle,
      
      // AI相关方法
      handleStartRewrite,
      handleSelectedTextChange,
      handleRewriteFromPanel,
      handleReplaceText,
      handleInsertText,
      handleCloseSession,
      
      // AI创作辅助功能
      handleStoryBackground,
      handleCharacterInfo,
      handleOutlineGenerate,
      handleChapterList
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
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  background: var(--sidebar-bg);
  min-height: 50px;
  box-shadow: var(--card-shadow);
  position: relative;
  z-index: 200;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex: 1;
  min-width: 0;
}

.current-novel-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-lg);
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
  padding: 0 var(--spacing-lg);
}

.chapter-title-editor {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  max-width: 500px;
  width: 100%;
}

.chapter-title-input {
  /* 使用统一的输入框样式 */
  flex: 1;
  text-align: center;
  font-weight: 500;
}

.chapter-title-display {
  flex: 1;
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  border: 2px solid transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-title-display:hover {
  background: var(--nav-hover-bg);
  color: var(--accent-solid);
  border-color: var(--accent-solid);
  transform: translateY(-1px);
}

.unsaved-indicator {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  font-style: italic;
  margin-left: var(--spacing-sm);
  vertical-align: middle;
  animation: pulse 2s ease-in-out infinite;
}

.editor-header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.auto-save-indicator {
  font-size: var(--font-sm);
  color: var(--success-color);
  font-weight: 500;
  animation: fadeInOut 2s ease-in-out;
  white-space: nowrap;
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

.back-btn, .save-btn {
  border: 1px solid var(--btn-secondary-hover);
  border-radius: 4px;
  padding: 8px 8px;
  background-color: var(--btn-secondary-bg);
}

.back-btn:hover, .save-btn:hover {
  background-color: var(--btn-secondary-hover);
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
