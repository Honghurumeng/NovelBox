<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="handleCancel">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">自定义AI重写</h3>
        <button class="close-btn" @click="handleCancel">×</button>
      </div>
      
      <div class="modal-body">
        <div class="input-section">
          <label class="input-label">请输入自定义提示:</label>
          <textarea 
            ref="promptInput"
            v-model="prompt"
            class="prompt-input"
            placeholder="例如：请将这段文本改写为更正式的语调..."
            rows="4"
            @keydown.ctrl.enter="handleConfirm"
          ></textarea>
          <div class="input-hint">
            提示：描述您希望如何处理选中的文本
          </div>
        </div>
        
        <div class="selected-text-preview">
          <div class="preview-label">选中的文本:</div>
          <div class="preview-text">{{ selectedText }}</div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleCancel">
          取消
        </button>
        <button 
          class="btn btn-primary" 
          @click="handleConfirm"
          :disabled="!prompt.trim()"
        >
          开始重写
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, watch } from 'vue'

export default {
  name: 'CustomPromptModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    selectedText: {
      type: String,
      default: ''
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const prompt = ref('')
    const promptInput = ref(null)
    
    const handleConfirm = () => {
      if (!prompt.value.trim()) return
      
      emit('confirm', prompt.value.trim())
      prompt.value = ''
    }
    
    const handleCancel = () => {
      emit('cancel')
      prompt.value = ''
    }
    
    // 当模态框显示时自动聚焦输入框
    watch(() => props.isVisible, (isVisible) => {
      if (isVisible) {
        nextTick(() => {
          promptInput.value?.focus()
        })
      }
    })
    
    return {
      prompt,
      promptInput,
      handleConfirm,
      handleCancel
    }
  }
}
</script>

<style scoped>
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
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px 24px;
  max-height: 400px;
  overflow-y: auto;
}

.input-section {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.prompt-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.prompt-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.prompt-input::placeholder {
  color: var(--text-muted);
}

.input-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.selected-text-preview {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
}

.preview-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.preview-text {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
  max-height: 80px;
  overflow-y: auto;
  word-wrap: break-word;
}

.modal-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 16px;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  min-height: 36px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--nav-selected-bg);
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 自定义滚动条 */
.modal-body::-webkit-scrollbar,
.preview-text::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track,
.preview-text::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb,
.preview-text::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover,
.preview-text::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.theme-dark .modal-body::-webkit-scrollbar-track,
.theme-dark .preview-text::-webkit-scrollbar-track,
.theme-oled .modal-body::-webkit-scrollbar-track,
.theme-oled .preview-text::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.theme-dark .modal-body::-webkit-scrollbar-thumb,
.theme-dark .preview-text::-webkit-scrollbar-thumb,
.theme-oled .modal-body::-webkit-scrollbar-thumb,
.theme-oled .preview-text::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.theme-dark .modal-body::-webkit-scrollbar-thumb:hover,
.theme-dark .preview-text::-webkit-scrollbar-thumb:hover,
.theme-oled .modal-body::-webkit-scrollbar-thumb:hover,
.theme-oled .preview-text::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>