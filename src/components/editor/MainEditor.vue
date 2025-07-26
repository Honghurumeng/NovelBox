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
        ref="editorTextarea"
        v-model="editorContent"
        class="chapter-editor" 
        :placeholder="$t('editor.startWriting')"
        @input="handleEditorInput"
        @keydown.ctrl.s.prevent="manualSave"
        @mouseup="handleTextSelection"
        @keyup="handleTextSelection"
        @contextmenu="handleContextMenu"
      ></textarea>
      
      <!-- 文本重写工具提示 -->
      <div 
        v-if="showRewriteTooltip" 
        ref="rewriteTooltip"
        class="rewrite-tooltip"
        :style="tooltipStyle"
      >
        <div class="tooltip-header">
          <span class="tooltip-title">{{ $t('editor.rewriteTooltip.title') }}</span>
          <button class="tooltip-close" @click="hideTooltip">×</button>
        </div>
        
        <div class="tooltip-actions">
          <button 
            class="action-btn expand-btn" 
            @click="rewriteText('expand')"
            :disabled="isProcessing"
          >
            {{ $t('editor.rewriteTooltip.expand') }}
          </button>
          <button 
            class="action-btn contract-btn" 
            @click="rewriteText('contract')"
            :disabled="isProcessing"
          >
            {{ $t('editor.rewriteTooltip.contract') }}
          </button>
          <button 
            class="action-btn beautify-btn" 
            @click="rewriteText('beautify')"
            :disabled="isProcessing"
          >
            {{ $t('editor.rewriteTooltip.beautify') }}
          </button>
        </div>
        
        <div v-if="isProcessing" class="processing-indicator">
          {{ $t('editor.rewriteTooltip.processing') }}
        </div>
        
        <div v-if="rewriteError" class="error-message">
          {{ $t('editor.rewriteTooltip.error', { error: rewriteError }) }}
        </div>
      </div>
      
      <!-- 右键上下文菜单 -->
      <div 
        v-if="showContextMenu" 
        ref="contextMenu"
        class="context-menu"
        :style="contextMenuStyle"
      >
        <div class="context-menu-item" @click="showCustomPromptModalFunc">
          {{ $t('editor.contextMenu.customRewrite') }}
        </div>
      </div>
      
      <!-- 自定义提示模态框 -->
      <div v-if="showCustomPromptModal" class="modal-overlay" @click="hideCustomPromptModalFunc">
        <div class="custom-prompt-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ $t('editor.rewriteTooltip.custom') }}</h3>
            <button class="modal-close" @click="hideCustomPromptModalFunc">×</button>
          </div>
          
          <div class="modal-content">
            <textarea 
              ref="customPromptTextarea"
              v-model="customPrompt"
              class="custom-prompt-textarea"
              :placeholder="$t('editor.rewriteTooltip.customPromptPlaceholder')"
              @keydown.ctrl.enter="applyCustomPrompt"
              @keydown.esc="hideCustomPromptModalFunc"
            ></textarea>
          </div>
          
          <div class="modal-actions">
            <button 
              class="action-btn apply-btn" 
              @click="applyCustomPrompt"
              :disabled="isProcessing || !customPrompt.trim()"
            >
              {{ $t('editor.rewriteTooltip.apply') }}
            </button>
            <button 
              class="action-btn cancel-btn" 
              @click="hideCustomPromptModalFunc"
              :disabled="isProcessing"
            >
              {{ $t('editor.rewriteTooltip.cancel') }}
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
import { useI18n } from 'vue-i18n'
import { llmService, LLMRequest } from '@/services'

export default {
  name: 'MainEditor',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const novelsStore = useNovelsStore()
    const chaptersStore = useChaptersStore()
    const uiStore = useUIStore()
    
    const titleInput = ref(null)
    const editorTextarea = ref(null)
    const rewriteTooltip = ref(null)
    const customPromptTextarea = ref(null)
    const editingTitle = ref('')
    const hasUnsavedChanges = ref(false)
    let lastSavedContent = ''
    
    // 重写工具提示相关状态
    const showRewriteTooltip = ref(false)
    const showContextMenu = ref(false)
    const showCustomPromptModal = ref(false)
    const customPrompt = ref('')
    const isProcessing = ref(false)
    const rewriteError = ref('')
    const selectedText = ref('')
    const selectionStart = ref(0)
    const selectionEnd = ref(0)
    const tooltipStyle = ref({})
    const contextMenuStyle = ref({})
    
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

    // 处理文本选择
    const handleTextSelection = () => {
      if (!editorTextarea.value) return
      
      const textarea = editorTextarea.value
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value.substring(start, end)
      
      // 如果有选中文本且长度合适，显示工具提示
      if (text && text.trim().length > 0 && text.length <= 1000) {
        selectedText.value = text
        selectionStart.value = start
        selectionEnd.value = end
        showTooltip()
      } else {
        hideTooltip()
      }
    }

    // 显示工具提示
    const showTooltip = () => {
      if (!editorTextarea.value) return
      
      const textarea = editorTextarea.value
      const rect = textarea.getBoundingClientRect()
      
      // 计算光标位置
      const scrollTop = textarea.scrollTop
      const textBeforeSelection = textarea.value.substring(0, selectionStart.value)
      const lines = textBeforeSelection.split('\n')
      const lineHeight = 22 // 基于CSS中的line-height: 1.8和font-size: 16px
      const charWidth = 9 // 估算字符宽度
      
      const lineNumber = lines.length - 1
      const columnNumber = lines[lines.length - 1].length
      
      const x = rect.left + columnNumber * charWidth
      const y = rect.top + (lineNumber * lineHeight) - scrollTop - 60 // 在选择上方显示
      
      tooltipStyle.value = {
        position: 'fixed',
        left: `${Math.max(10, Math.min(x, window.innerWidth - 300))}px`,
        top: `${Math.max(10, y)}px`,
        zIndex: 1000
      }
      
      showRewriteTooltip.value = true
      rewriteError.value = ''
    }

    // 隐藏工具提示
    const hideTooltip = () => {
      showRewriteTooltip.value = false
      showContextMenu.value = false
      rewriteError.value = ''
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
        
        contextMenuStyle.value = {
          position: 'fixed',
          left: `${event.clientX}px`,
          top: `${event.clientY}px`,
          zIndex: 1000
        }
        
        showContextMenu.value = true
        showRewriteTooltip.value = false
      }
    }

    // 显示自定义提示模态框
    const showCustomPromptModalFunc = () => {
      showCustomPromptModal.value = true
      showContextMenu.value = false
      customPrompt.value = ''
      
      nextTick(() => {
        customPromptTextarea.value?.focus()
      })
    }

    // 隐藏自定义提示模态框
    const hideCustomPromptModalFunc = () => {
      showCustomPromptModal.value = false
      customPrompt.value = ''
    }

    // 应用自定义提示
    const applyCustomPrompt = () => {
      if (customPrompt.value.trim()) {
        hideCustomPromptModalFunc()
        rewriteText('custom')
      }
    }

    // 获取重写配置
    const getRewriteConfig = () => {
      try {
        const savedConfig = localStorage.getItem('novelbox-rewrite-config')
        if (!savedConfig) return null
        
        const config = JSON.parse(savedConfig)
        if (!config.provider || !config.model) return null
        
        return config
      } catch (error) {
        console.error('Failed to load rewrite config:', error)
        return null
      }
    }

    // 生成重写提示
    const generatePrompt = (type, text, customPromptText = '') => {
      const prompts = {
        expand: `直接输出结果，不要任何助手提示：请扩写以下文本，增加更多细节、描述和内容，但保持原有的风格和意思：\n\n${text}`,
        contract: `直接输出结果，不要任何助手提示：请缩写以下文本，保留核心内容和关键信息，使其更加简洁：\n\n${text}`,
        beautify: `直接输出结果，不要任何助手提示：请优化以下文本的文笔，改进语言表达（如增加修辞、使用高级词汇或增加成语使用）、增强可读性，但保持原意不变：\n\n${text}`,
        custom: customPromptText ? `${customPromptText}\n\n文本：${text}` : text
      }
      
      return prompts[type] || text
    }

    // 重写文本
    const rewriteText = async (type) => {
      const config = getRewriteConfig()
      if (!config) {
        rewriteError.value = t('editor.rewriteTooltip.noModelConfigured')
        return
      }

      if (type === 'custom' && !customPrompt.value.trim()) {
        return
      }

      isProcessing.value = true
      rewriteError.value = ''

      try {
        const prompt = generatePrompt(type, selectedText.value, customPrompt.value)
        const request = new LLMRequest({
          prompt: prompt,
          maxTokens: 2000,
          temperature: 0.7
        })

        const response = await llmService.generateContent(
          config.provider,
          config.model,
          request
        )

        if (response.success && response.content) {
          // 替换选中的文本
          const textarea = editorTextarea.value
          const currentContent = textarea.value
          const newContent = 
            currentContent.substring(0, selectionStart.value) +
            response.content.trim() +
            currentContent.substring(selectionEnd.value)
          
          editorContent.value = newContent
          hideTooltip()
        } else {
          rewriteError.value = response.error || 'Unknown error'
        }
      } catch (error) {
        console.error('Rewrite failed:', error)
        rewriteError.value = error.message || 'Unknown error'
      } finally {
        isProcessing.value = false
      }
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
      
      // ESC键隐藏工具提示和模态框
      if (event.key === 'Escape') {
        hideTooltip()
        if (showCustomPromptModal.value) {
          hideCustomPromptModalFunc()
        }
      }
    }

    // 点击外部隐藏工具提示
    const handleClickOutside = (event) => {
      // 隐藏工具提示
      if (showRewriteTooltip.value && 
          rewriteTooltip.value && 
          !rewriteTooltip.value.contains(event.target)) {
        hideTooltip()
      }
      
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

    const autoSaveCallback = async () => {
      hasUnsavedChanges.value = false
    }

    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('click', handleClickOutside)
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
      document.removeEventListener('click', handleClickOutside)
      chaptersStore.clearAutoSaveTimer()
    })

    return {
      novelsStore,
      chaptersStore,
      uiStore,
      titleInput,
      editorTextarea,
      rewriteTooltip,
      customPromptTextarea,
      editingTitle,
      editorContent,
      hasUnsavedChanges,
      showRewriteTooltip,
      showContextMenu,
      showCustomPromptModal,
      customPrompt,
      isProcessing,
      rewriteError,
      tooltipStyle,
      contextMenuStyle,
      goToHomepage,
      manualSave,
      handleEditorInput,
      startEditingTitle,
      finishEditingTitle,
      cancelEditingTitle,
      handleTextSelection,
      handleContextMenu,
      hideTooltip,
      showCustomPromptModalFunc,
      hideCustomPromptModalFunc,
      applyCustomPrompt,
      rewriteText
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

/* 重写工具提示样式 */
.rewrite-tooltip {
  background: var(--tooltip-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--tooltip-shadow);
  padding: 0;
  min-width: 280px;
  max-width: 400px;
  font-size: 14px;
  backdrop-filter: blur(8px);
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--tooltip-header-bg);
  border-radius: 8px 8px 0 0;
}

.tooltip-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 13px;
}

.tooltip-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.tooltip-close:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
}

.tooltip-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 12px;
}

.action-btn {
  padding: 8px 12px;
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
  background: var(--btn-hover-bg);
  color: var(--btn-hover-color);
  border-color: var(--accent-color);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.expand-btn:hover:not(:disabled) {
  background: #e3f2fd;
  color: #1976d2;
  border-color: #1976d2;
}

.contract-btn:hover:not(:disabled) {
  background: #fff3e0;
  color: #f57c00;
  border-color: #f57c00;
}

.beautify-btn:hover:not(:disabled) {
  background: #f3e5f5;
  color: #7b1fa2;
  border-color: #7b1fa2;
}

.custom-btn:hover:not(:disabled) {
  background: #e8f5e8;
  color: #388e3c;
  border-color: #388e3c;
}

.custom-prompt-input {
  padding: 12px;
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

.custom-prompt-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.apply-btn {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.apply-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.cancel-btn {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
}

.processing-indicator {
  padding: 8px 12px;
  text-align: center;
  color: var(--accent-color);
  font-size: 12px;
  font-style: italic;
  border-top: 1px solid var(--border-color);
  background: var(--tooltip-processing-bg);
}

.error-message {
  padding: 8px 12px;
  text-align: center;
  color: var(--error-color);
  font-size: 12px;
  border-top: 1px solid var(--border-color);
  background: var(--tooltip-error-bg);
}

/* 工具提示主题变量 */
:root {
  --tooltip-bg: rgba(255, 255, 255, 0.95);
  --tooltip-header-bg: rgba(248, 249, 250, 0.9);
  --tooltip-shadow: rgba(0, 0, 0, 0.1);
  --tooltip-processing-bg: rgba(33, 150, 243, 0.05);
  --tooltip-error-bg: rgba(244, 67, 54, 0.05);
  --btn-hover-bg: var(--nav-hover-bg);
  --btn-hover-color: var(--text-primary);
  --accent-hover: #1976d2;
  --error-color: #d32f2f;
}

.theme-dark {
  --tooltip-bg: rgba(30, 30, 30, 0.95);
  --tooltip-header-bg: rgba(45, 45, 45, 0.9);
  --tooltip-shadow: rgba(0, 0, 0, 0.3);
  --tooltip-processing-bg: rgba(33, 150, 243, 0.1);
  --tooltip-error-bg: rgba(244, 67, 54, 0.1);
  --accent-hover: #42a5f5;
  --error-color: #f44336;
}

.theme-oled {
  --tooltip-bg: rgba(0, 0, 0, 0.95);
  --tooltip-header-bg: rgba(18, 18, 18, 0.9);
  --tooltip-shadow: rgba(255, 255, 255, 0.1);
  --tooltip-processing-bg: rgba(33, 150, 243, 0.1);
  --tooltip-error-bg: rgba(244, 67, 54, 0.1);
  --accent-hover: #42a5f5;
  --error-color: #f44336;
}

/* 右键上下文菜单样式 */
.context-menu {
  background: var(--tooltip-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px var(--tooltip-shadow);
  padding: 4px 0;
  min-width: 160px;
  backdrop-filter: blur(8px);
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 13px;
  transition: all 0.2s;
}

.context-menu-item:hover {
  background: var(--nav-hover-bg);
  color: var(--accent-color);
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
  background: var(--tooltip-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px var(--tooltip-shadow);
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
  background: var(--tooltip-header-bg);
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

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--tooltip-header-bg);
}
</style>