<template>
  <div class="main-editor">
    <div class="editor-content">
      <textarea 
        ref="editorTextarea"
        v-model="editorContent"
        class="chapter-editor" 
        placeholder="开始写作..."
        @input="handleEditorInput"
        @mouseup="handleTextSelection"
        @keyup="handleTextSelection"
        @contextmenu="handleContextMenu"
      ></textarea>
      
      <!-- 新的右键菜单组件 -->
      <ContextMenu
        :visible="showContextMenu"
        :position="contextMenuPosition"
        :selected-text="selectedText"
        :textarea-ref="editorTextarea"
        @rewrite="handleRewrite"
        @hide="hideContextMenu"
      />
      
      <!-- 自定义提示模态框 -->
      <div v-if="showCustomPromptModal" class="modal-overlay" @click="hideCustomPromptModal">
        <div class="custom-prompt-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">自定义</h3>
            <button class="modal-close" @click="hideCustomPromptModal">×</button>
          </div>
          
          <div class="modal-content">
            <textarea
              ref="customPromptTextarea"
              v-model="customPrompt"
              class="custom-prompt-textarea"
              placeholder="输入自定义提示..."
              @keydown.ctrl.enter.exact.prevent="applyCustomPrompt"
              @keydown.esc="hideCustomPromptModal"
            ></textarea>
          </div>
          
          <div class="modal-actions">
            <button 
              class="action-btn apply-btn" 
              @click="applyCustomPrompt"
              :disabled="!customPrompt.trim()"
            >
              应用
            </button>
            <button 
              class="action-btn cancel-btn" 
              @click="hideCustomPromptModal"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelsStore, useChaptersStore, useUIStore } from '@/stores'
import { llmService, LLMRequest } from '@/services'
import ContextMenu from './ContextMenu.vue'

export default {
  name: 'MainEditor',
  components: {
    ContextMenu
  },
  emits: ['start-rewrite'],
  setup(props, { emit }) {
    const router = useRouter()
    const novelsStore = useNovelsStore()
    const chaptersStore = useChaptersStore()
    const uiStore = useUIStore()
    
    const editorTextarea = ref(null)
    const customPromptTextarea = ref(null)
    
    // 撤销/重做
    const historyStack = ref([])
    const historyIndex = ref(-1)
    const isUndoingOrRedoing = ref(false)
    const HISTORY_LIMIT = 100
    
    // 右键菜单相关状态
    const showContextMenu = ref(false)
    const showCustomPromptModal = ref(false)
    const customPrompt = ref('')
    const selectedText = ref('')
    const selectionStart = ref(0)
    const selectionEnd = ref(0)
    const contextMenuPosition = ref({ x: 0, y: 0 })
    
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

    
    // 处理文本选择
    const handleTextSelection = () => {
      if (!editorTextarea.value) return
      
      const textarea = editorTextarea.value
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value.substring(start, end)
      
      // 更新选择状态
      if (text && text.trim().length > 0 && text.length <= 1000) {
        selectedText.value = text
        selectionStart.value = start
        selectionEnd.value = end
      } else {
        selectedText.value = ''
      }
    }

    // 处理右键菜单
    const handleContextMenu = (event) => {
      if (!editorTextarea.value) return
      
      const textarea = editorTextarea.value
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value.substring(start, end)
      
      // 只有选中文本时才显示右键菜单
      if (text && text.trim().length > 0 && text.length <= 1000) {
        event.preventDefault()
        
        selectedText.value = text
        selectionStart.value = start
        selectionEnd.value = end
        
        contextMenuPosition.value = {
          x: event.clientX,
          y: event.clientY
        }
        
        showContextMenu.value = true
      }
    }

    // 隐藏右键菜单
    const hideContextMenu = () => {
      showContextMenu.value = false
    }

    // 处理重写请求
    const handleRewrite = (type) => {
      if (type === 'custom') {
        showCustomPromptModal.value = true
        nextTick(() => {
          customPromptTextarea.value?.focus()
        })
      } else {
        startRewrite(type)
      }
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
    
    // 隐藏自定义提示模态框
    const hideCustomPromptModal = () => {
      showCustomPromptModal.value = false
      customPrompt.value = ''
    }

    // 应用自定义提示
    const applyCustomPrompt = () => {
      const promptText = customPrompt.value.trim()
      if (promptText) {
        console.log('应用自定义提示:', promptText)
        startRewrite('custom', promptText)
        hideCustomPromptModal()
      }
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

    // 点击外部隐藏右键菜单
    const handleClickOutside = (event) => {
      // 隐藏右键菜单
      if (showContextMenu.value) {
        showContextMenu.value = false
      }
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
      // 初始化自动保存定时器
      initAutoSave()
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
      chaptersStore.clearAutoSaveTimer()
    })

    return {
      novelsStore,
      chaptersStore,
      uiStore,
      editorTextarea,
      customPromptTextarea,
      editorContent,
      showContextMenu,
      showCustomPromptModal,
      customPrompt,
      selectedText,
      contextMenuPosition,
      handleEditorInput,
      handleTextSelection,
      handleContextMenu,
      hideContextMenu,
      handleRewrite,
      hideCustomPromptModal,
      applyCustomPrompt
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

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.custom-prompt-modal {
  background: var(--modal-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--card-hover-shadow);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--sidebar-bg);
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
}

.modal-content {
  padding: 20px;
}

.custom-prompt-textarea {
  width: 100%;
  min-height: 80px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 12px;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 8px;
}

.custom-prompt-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--sidebar-bg);
}

.action-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
}

.action-btn:hover:not(:disabled) {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.apply-btn {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-color);
  border-color: transparent;
}

.apply-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.cancel-btn {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
}
</style>