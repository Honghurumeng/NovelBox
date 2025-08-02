<template>
  <div class="main-editor">
    <!-- 章纲展示区域 -->
    <div v-if="chapterOutline" class="chapter-outline-section">
      <div class="outline-header">
        <div class="outline-title">
          <span class="outline-icon">📋</span>
          章节大纲
        </div>
        <button class="outline-toggle-btn" @click="toggleOutlineExpanded" :title="outlineExpanded ? '收起大纲' : '展开大纲'">
          <span class="toggle-icon">{{ outlineExpanded ? '▼' : '▶' }}</span>
        </button>
      </div>
      <div v-if="outlineExpanded" class="outline-content">
        <div class="outline-text">{{ chapterOutline }}</div>
      </div>
    </div>
    
    <div class="editor-content">
      <textarea 
        ref="editorTextarea"
        v-model="editorContent"
        class="chapter-editor" 
        placeholder="开始写作..."
        @input="handleEditorInput"
        @mouseup="handleTextSelection"
        @keyup="handleTextSelection"
        @select="handleTextSelection"
        @selectionchange="handleTextSelection"
        @focus="handleTextSelection"
        @click="handleTextSelection"
        @keydown="handleKeyboardSelection"
      ></textarea>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelsStore, useChaptersStore, useUIStore } from '@/stores'
import { llmService, LLMRequest } from '@/services'

export default {
  name: 'MainEditor',
  emits: ['start-rewrite', 'selected-text-change'],
  setup(props, { emit }) {
    const router = useRouter()
    const novelsStore = useNovelsStore()
    const chaptersStore = useChaptersStore()
    const uiStore = useUIStore()
    
    const editorTextarea = ref(null)
    
    // 撤销/重做
    const historyStack = ref([])
    const historyIndex = ref(-1)
    const isUndoingOrRedoing = ref(false)
    const HISTORY_LIMIT = 100
    
    // 自定义提示模态框状态
    const selectedText = ref('')
    const selectionStart = ref(0)
    const selectionEnd = ref(0)
    
    // 章纲展示相关状态
    const chapterOutline = ref('')
    const outlineExpanded = ref(true)
    
    const editorContent = computed({
      get: () => chaptersStore.currentChapterContent,
      set: (value) => {
        chaptersStore.updateChapterContent(value)
      }
    })

    
    // 处理编辑器输入
    const handleEditorInput = () => {
      // Content is automatically updated via v-model
      // Word count is updated in the store
    }

    
    // 文本选择防抖计时器
    let selectionTimeout = null
    
    // 处理文本选择
    const handleTextSelection = () => {
      // 清除之前的计时器
      if (selectionTimeout) {
        clearTimeout(selectionTimeout)
      }
      
      // 使用防抖，避免过度频繁调用
      selectionTimeout = setTimeout(() => {
        if (!editorTextarea.value) return
        
        const textarea = editorTextarea.value
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value.substring(start, end)
        
        console.log('文本选择变化:', { start, end, textLength: text.length, text: text.slice(0, 50) + (text.length > 50 ? '...' : '') })
        
        // 更新选择状态
        if (text && text.trim().length > 0 && text.length <= 1000) {
          selectedText.value = text
          selectionStart.value = start
          selectionEnd.value = end
          // 通知父组件文本选择变化
          emit('selected-text-change', {
            text: text,
            start: start,
            end: end
          })
        } else {
          selectedText.value = ''
          // 通知父组件清空选择
          emit('selected-text-change', {
            text: '',
            start: 0,
            end: 0
          })
        }
      }, 100) // 100ms防抖延迟
    }

    // 全局选择变化监听器
    const handleGlobalSelectionChange = () => {
      // 对于textarea，需要检查document.activeElement
      if (document.activeElement === editorTextarea.value) {
        console.log('全局选择变化检测到编辑器为焦点元素，触发文本选择检查')
        handleTextSelection()
      }
    }
    
    // 处理键盘选择事件
    const handleKeyboardSelection = (event) => {
      // 检测可能改变选择的键盘事件
      const selectionKeys = [
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End', 'PageUp', 'PageDown'
      ]
      
      const isSelectionModifier = event.shiftKey || event.ctrlKey || event.metaKey
      const isSelectionKey = selectionKeys.includes(event.key)
      const isSelectAll = (event.ctrlKey || event.metaKey) && event.key === 'a'
      
      if (isSelectionModifier && isSelectionKey || isSelectAll) {
        console.log('检测到键盘选择操作:', event.key, { shift: event.shiftKey, ctrl: event.ctrlKey })
        // 延迟一点执行，让键盘事件先完成
        setTimeout(() => {
          handleTextSelection()
        }, 10)
      }
    }
    
    // 获取当前光标位置
    const getCurrentCursorPosition = () => {
      if (!editorTextarea.value) return 0
      return editorTextarea.value.selectionStart
    }
    
    // 设置光标位置
    const setCursorPosition = (position) => {
      if (!editorTextarea.value) return
      nextTick(() => {
        editorTextarea.value.selectionStart = position
        editorTextarea.value.selectionEnd = position
        editorTextarea.value.focus()
      })
    }
    
    // 处理重写请求（可以从AIPanel调用）
    const handleRewriteFromPanel = (type, customPromptText = '') => {
      // 直接开始重写，AIPanel会处理自定义提示的输入
      startRewrite(type, customPromptText)
    }

    // 开始重写
    const startRewrite = (type, customPromptText = '') => {
      console.log('开始重写:', type, customPromptText)
      if (!selectedText.value) return

      // 确保右侧面板展开
      if (uiStore.rightSidebarCollapsed) {
        uiStore.toggleRightSidebar()
      }

      // 创建重写会话并传递给父组件
      const rewriteSession = {
        type,
        originalText: selectedText.value,
        customPrompt: customPromptText,
        selectionStart: selectionStart.value,
        selectionEnd: selectionEnd.value
      }

      emit('start-rewrite', rewriteSession)
    }
    
    // 切换大纲展开状态
    const toggleOutlineExpanded = () => {
      outlineExpanded.value = !outlineExpanded.value
    }

    const undo = () => {
      if (historyIndex.value > 0) {
        isUndoingOrRedoing.value = true
        historyIndex.value--
        editorContent.value = historyStack.value[historyIndex.value]
        nextTick(() => {
          isUndoingOrRedoing.value = false
        })
      }
    }

    const redo = () => {
      if (historyIndex.value < historyStack.value.length - 1) {
        isUndoingOrRedoing.value = true
        historyIndex.value++
        editorContent.value = historyStack.value[historyIndex.value]
        nextTick(() => {
          isUndoingOrRedoing.value = false
        })
      }
    }

    // 监听当前章节变化，更新编辑器内容
    watch(() => chaptersStore.currentChapter, (newChapter) => {
      if (newChapter) {
        // Content is automatically updated via computed property
        // 初始化撤销/重做历史
        historyStack.value = [newChapter.content || '']
        historyIndex.value = 0
      } else {
        historyStack.value = []
        historyIndex.value = -1
      }
    })
    
    // 监听章节内容变化
    watch(() => chaptersStore.currentChapterContent, (newContent) => {
      if (isUndoingOrRedoing.value || newContent === undefined) return

      // 如果新内容与历史记录中的当前内容相同，则不进行任何操作
      if (newContent === historyStack.value[historyIndex.value]) return

      // 如果在撤销后进行了新的编辑，则清除"未来"的历史记录
      if (historyIndex.value < historyStack.value.length - 1) {
        historyStack.value.splice(historyIndex.value + 1)
      }

      historyStack.value.push(newContent)

      // 保持历史记录堆栈的大小
      if (historyStack.value.length > HISTORY_LIMIT) {
        historyStack.value.shift()
      }
      historyIndex.value = historyStack.value.length - 1
    })

    // 添加键盘事件监听
    const handleKeyDown = (event) => {
      // 统一处理快捷键
      if (event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case 's':
            event.preventDefault()
            // 保存功能由父组件 EditorPage 处理
            break
          case 'z':
            event.preventDefault()
            undo()
            break
          case 'y':
            event.preventDefault()
            redo()
            break
        }
      }
      
      // ESC键隐藏模态框
      if (event.key === 'Escape') {
        if (showCustomPromptModal.value) {
          hideCustomPromptModal()
        }
      }
    }

    // 点击外部处理
    const handleClickOutside = (event) => {
      // 可以在这里添加其他需要点击外部隐藏的功能
    }

    // 初始化自动保存定时器
    const initAutoSave = () => {
      if (chaptersStore.currentChapter) {
        chaptersStore.startAutoSave()
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('click', handleClickOutside)
      // 添加全局选择变化监听
      document.addEventListener('selectionchange', handleGlobalSelectionChange)
      // 初始化自动保存定时器
      initAutoSave()
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
      // 移除全局选择变化监听
      document.removeEventListener('selectionchange', handleGlobalSelectionChange)
      chaptersStore.clearAutoSaveTimer()
      // 清理防抖计时器
      if (selectionTimeout) {
        clearTimeout(selectionTimeout)
      }
    })

    return {
      novelsStore,
      chaptersStore,
      uiStore,
      editorTextarea,
      editorContent,
      selectedText,
      chapterOutline,
      outlineExpanded,
      handleEditorInput,
      handleTextSelection,
      handleKeyboardSelection,
      getCurrentCursorPosition,
      setCursorPosition,
      handleRewriteFromPanel,
      toggleOutlineExpanded
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

/* 章纲展示区域 */
.chapter-outline-section {
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  margin: 0 24px;
  margin-top: 24px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--border-color);
}

.outline-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.outline-icon {
  font-size: 1rem;
}

.outline-toggle-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.outline-toggle-btn:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
}

.toggle-icon {
  font-size: 0.8rem;
  transition: transform 0.2s;
}

.outline-content {
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.outline-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
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