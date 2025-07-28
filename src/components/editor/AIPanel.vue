<template>
  <div class="ai-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <span class="ai-icon">🤖</span>
        {{ $t('editor.aiPanel.title') }}
      </h2>
    </div>
    
    <div class="panel-content">
      <!-- AI重写结果显示区域 -->
      <div v-if="rewriteSession" class="rewrite-session">
        <div class="session-header">
          <div class="session-title">
            <span class="session-icon">✨</span>
            {{ getRewriteTypeLabel(rewriteSession.type) }}
          </div>
          <button class="close-session-btn" @click="closeRewriteSession">
            ×
          </button>
        </div>
        
        <!-- 原文显示 -->
        <div class="original-text-section">
          <div class="section-label">{{ $t('editor.aiPanel.originalText') }}</div>
          <div class="original-text">{{ rewriteSession.originalText }}</div>
        </div>
        
        <!-- 重写结果显示 -->
        <div class="rewrite-result-section">
          <div class="section-label">
            {{ $t('editor.aiPanel.rewriteResult') }}
            <span v-if="isStreaming" class="streaming-indicator">
              {{ $t('editor.aiPanel.generating') }}
              <span class="dots">...</span>
            </span>
          </div>
          
          <div class="rewrite-result">
            <div class="result-text" v-html="formatRewriteText(displayText)"></div>
            
            <!-- 流式输出光标 -->
            <span v-if="isStreaming" class="streaming-cursor">|</span>
          </div>
          
          <!-- 错误信息 -->
          <div v-if="rewriteError" class="error-message">
            <div class="error-content">
              <span class="error-icon">⚠️</span>
              <span class="error-text">{{ rewriteError }}</span>
            </div>
            <button class="retry-btn error-retry-btn" @click="retryRewrite">
              <span class="btn-icon">🔄</span>
              {{ $t('editor.aiPanel.retry') }}
            </button>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div v-if="!isStreaming && (displayText || rewriteError)" class="action-buttons">
          <button v-if="displayText && !rewriteError" class="action-btn replace-btn" @click="replaceText">
            <span class="btn-icon">✅</span>
            {{ $t('editor.aiPanel.replace') }}
          </button>
          <button class="action-btn retry-btn" @click="retryRewrite">
            <span class="btn-icon">🔄</span>
            {{ $t('editor.aiPanel.retry') }}
          </button>
        </div>
        
        <!-- 进一步要求输入 -->
        <div v-if="!isStreaming && displayText && !rewriteError" class="further-request">
          <div class="section-label">{{ $t('editor.aiPanel.furtherRequest') }}</div>
          <textarea 
            v-model="furtherPrompt"
            class="further-prompt-input"
            :placeholder="$t('editor.aiPanel.furtherPromptPlaceholder')"
            @keydown.ctrl.enter="applyFurtherRequest"
          ></textarea>
          <button 
            class="action-btn apply-further-btn" 
            @click="applyFurtherRequest"
            :disabled="!furtherPrompt.trim() || isStreaming"
          >
            <span class="btn-icon">🚀</span>
            {{ $t('editor.aiPanel.applyFurther') }}
          </button>
        </div>
      </div>
      
      <!-- 默认状态 - 无重写会话时显示 -->
      <div v-else class="default-state">
        <div class="welcome-section">
          <div class="welcome-icon">🤖</div>
          <h3 class="welcome-title">{{ $t('editor.aiPanel.welcomeTitle') }}</h3>
          <p class="welcome-description">{{ $t('editor.aiPanel.welcomeDescription') }}</p>
        </div>
        
        <div class="tips-section">
          <div class="section-label">{{ $t('editor.aiPanel.tips') }}</div>
          <div class="tips-list">
            <div class="tip-item">
              <span class="tip-icon">💡</span>
              {{ $t('editor.aiPanel.tip1') }}
            </div>
            <div class="tip-item">
              <span class="tip-icon">✨</span>
              {{ $t('editor.aiPanel.tip2') }}
            </div>
            <div class="tip-item">
              <span class="tip-icon">🎯</span>
              {{ $t('editor.aiPanel.tip3') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import { useUIStore } from '@/stores'
import { useI18n } from 'vue-i18n'
import { llmService, LLMRequest } from '@/services'

export default {
  name: 'AIPanel',
  props: {
    rewriteSession: {
      type: Object,
      default: null
    }
  },
  emits: ['replace-text', 'close-session'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const uiStore = useUIStore()
    
    const displayText = ref('')
    const isStreaming = ref(false)
    const rewriteError = ref('')
    const furtherPrompt = ref('')
    
    const startRewrite = async () => {
      if (!props.rewriteSession) return
      
      displayText.value = ''
      isStreaming.value = true
      rewriteError.value = ''
      
      try {
        const config = getRewriteConfig()
        if (!config) {
          throw new Error(t('editor.rewriteTooltip.noModelConfigured'))
        }
        
        const prompt = generatePrompt(
          props.rewriteSession.type, 
          props.rewriteSession.originalText,
          props.rewriteSession.customPrompt || ''
        )
        console.log('Rewrite prompt:', props.rewriteSession.customPrompt)
        
        const request = new LLMRequest({
          prompt: prompt,
          maxTokens: 2000,
          temperature: 0.7,
          stream: true
        })
        
        const response = await llmService.generateStreamContent(
          config.provider,
          config.model,
          request,
          (chunk) => {
            if (chunk.delta) {
              displayText.value += chunk.delta
            }
          }
        )
        
        if (!response.success) {
          throw new Error(response.error || 'Unknown error')
        }
        
      } catch (error) {
        console.error('Rewrite failed:', error)
        rewriteError.value = error.message || 'Unknown error'
      } finally {
        isStreaming.value = false
      }
    }
    
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
    
    const generatePrompt = (type, text, customPromptText = '') => {
      const prompts = {
        expand: `直接输出结果，不要任何助手提示：请扩写以下文本，增加更多细节、描述和内容，但保持原有的风格和意思：\n\n${text}`,
        contract: `直接输出结果，不要任何助手提示：请缩写以下文本，保留核心内容和关键信息，使其更加简洁：\n\n${text}`,
        beautify: `直接输出结果，不要任何助手提示：请优化以下文本的文笔，改进语言表达（如增加修辞、使用高级词汇或增加成语使用）、增强可读性，但保持原意不变：\n\n${text}`,
        custom: customPromptText ? `直接输出结果，不要任何助手提示：${customPromptText}\n\n文本：${text}` : text
      }
      console.log(customPromptText)
      // console.log(prompts)
      return prompts[type] || text
    }
    
    const getRewriteTypeLabel = (type) => {
      const labels = {
        expand: t('editor.rewriteTooltip.expand'),
        contract: t('editor.rewriteTooltip.contract'),
        beautify: t('editor.rewriteTooltip.beautify'),
        custom: t('editor.rewriteTooltip.custom')
      }
      return labels[type] || type
    }
    
    const formatRewriteText = (text) => {
      return text.replace(/\n/g, '<br>')
    }
    
    const replaceText = () => {
      if (displayText.value && props.rewriteSession) {
        emit('replace-text', {
          originalText: props.rewriteSession.originalText,
          newText: displayText.value.trim(),
          selectionStart: props.rewriteSession.selectionStart,
          selectionEnd: props.rewriteSession.selectionEnd
        })
        closeRewriteSession()
      }
    }
    
    const retryRewrite = () => {
      startRewrite()
    }
    
    const applyFurtherRequest = () => {
      if (!furtherPrompt.value.trim()) return
      
      // 创建新的重写会话，基于当前结果进行进一步处理
      const newSession = {
        ...props.rewriteSession,
        type: 'custom',
        customPrompt: furtherPrompt.value,
        originalText: displayText.value // 使用当前重写结果作为新的原文
      }
      
      // 重置进一步要求输入
      furtherPrompt.value = ''
      
      // 更新会话并重新开始重写
      Object.assign(props.rewriteSession, newSession)
      startRewrite()
    }
    
    const closeRewriteSession = () => {
      emit('close-session')
    }
    
    // 监听重写会话变化，自动开始重写
    watch(() => props.rewriteSession, (newSession) => {
      if (newSession) {
        nextTick(() => {
          startRewrite()
        })
      }
    }, { immediate: true })
    
    return {
      uiStore,
      displayText,
      isStreaming,
      rewriteError,
      furtherPrompt,
      getRewriteTypeLabel,
      formatRewriteText,
      replaceText,
      retryRewrite,
      applyFurtherRequest,
      closeRewriteSession
    }
  }
}
</script>

<style scoped>
.ai-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--sidebar-bg);
}

.panel-title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.ai-icon {
  font-size: 1.3rem;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 重写会话样式 */
.rewrite-session {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.session-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.session-icon {
  font-size: 1.1rem;
}

.close-session-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
  line-height: 1;
}

.close-session-btn:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
}

.section-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 原文显示 */
.original-text-section {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
}

.original-text {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px;
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
  max-height: 80px;
  overflow-y: auto;
  word-wrap: break-word;
}

/* 重写结果显示 */
.rewrite-result-section {
  flex: 1;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.streaming-indicator {
  font-size: 0.8rem;
  color: var(--accent-color);
  font-weight: 500;
}

.dots {
  animation: blink 1.4s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.rewrite-result {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  overflow-y: auto;
  position: relative;
  min-height: 120px;
}

.result-text {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.streaming-cursor {
  color: var(--accent-color);
  font-weight: bold;
  animation: blink-cursor 1s infinite;
}

@keyframes blink-cursor {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.error-message {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--btn-danger-bg);
  color: var(--btn-danger-color);
  border-radius: 6px;
  font-size: 0.85rem;
  margin-top: 8px;
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.error-text {
  flex: 1;
  line-height: 1.4;
}

.error-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.error-retry-btn {
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  flex: 1;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.replace-btn:hover:not(:disabled) {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-color);
  border-color: transparent;
}

.retry-btn:hover:not(:disabled) {
  background: #ff9800;
  color: white;
  border-color: #ff9800;
}

.btn-icon {
  font-size: 0.9rem;
}

/* 进一步要求 */
.further-request {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
}

.further-prompt-input {
  width: 100%;
  min-height: 60px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.85rem;
  line-height: 1.4;
  resize: vertical;
  margin-bottom: 8px;
  font-family: inherit;
}

.further-prompt-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.apply-further-btn {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-color);
  border-color: transparent;
  width: 100%;
}

.apply-further-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 默认状态 */
.default-state {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.welcome-section {
  text-align: center;
  padding: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.welcome-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.welcome-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: var(--text-primary);
  font-weight: 600;
}

.welcome-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.tips-section {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.tip-icon {
  font-size: 1rem;
  margin-top: 1px;
  flex-shrink: 0;
}


/* 自定义滚动条 */
.panel-content::-webkit-scrollbar,
.rewrite-result::-webkit-scrollbar,
.original-text::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track,
.rewrite-result::-webkit-scrollbar-track,
.original-text::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb,
.rewrite-result::-webkit-scrollbar-thumb,
.original-text::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover,
.rewrite-result::-webkit-scrollbar-thumb:hover,
.original-text::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.theme-dark .panel-content::-webkit-scrollbar-track,
.theme-dark .rewrite-result::-webkit-scrollbar-track,
.theme-dark .original-text::-webkit-scrollbar-track,
.theme-oled .panel-content::-webkit-scrollbar-track,
.theme-oled .rewrite-result::-webkit-scrollbar-track,
.theme-oled .original-text::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.theme-dark .panel-content::-webkit-scrollbar-thumb,
.theme-dark .rewrite-result::-webkit-scrollbar-thumb,
.theme-dark .original-text::-webkit-scrollbar-thumb,
.theme-oled .panel-content::-webkit-scrollbar-thumb,
.theme-oled .rewrite-result::-webkit-scrollbar-thumb,
.theme-oled .original-text::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.theme-dark .panel-content::-webkit-scrollbar-thumb:hover,
.theme-dark .rewrite-result::-webkit-scrollbar-thumb:hover,
.theme-dark .original-text::-webkit-scrollbar-thumb:hover,
.theme-oled .panel-content::-webkit-scrollbar-thumb:hover,
.theme-oled .rewrite-result::-webkit-scrollbar-thumb:hover,
.theme-oled .original-text::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>