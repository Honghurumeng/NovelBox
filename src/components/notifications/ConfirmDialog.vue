<template>
  <div class="confirm-dialog" :class="[`confirm-${type}`, { 'confirm-entering': isEntering, 'confirm-leaving': isLeaving }]">
    <!-- 图标 -->
    <div class="confirm-icon">
      <span v-if="type === 'danger'" class="icon-danger">⚠</span>
      <span v-else-if="type === 'warning'" class="icon-warning">⚠</span>
      <span v-else-if="type === 'info'" class="icon-info">ℹ</span>
      <span v-else class="icon-question">?</span>
    </div>
    
    <!-- 内容 -->
    <div class="confirm-content">
      <h3 v-if="title" class="confirm-title">{{ title }}</h3>
      <p class="confirm-message">{{ message }}</p>
    </div>
    
    <!-- 操作按钮 -->
    <div class="confirm-actions">
      <button 
        class="btn btn-secondary confirm-cancel"
        @click="handleCancel"
        :disabled="loading"
      >
        {{ cancelText }}
      </button>
      <button 
        class="btn confirm-confirm"
        :class="confirmButtonClass"
        @click="handleConfirm"
        :disabled="loading"
      >
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? '处理中...' : confirmText }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'danger', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  asyncAction: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const isEntering = ref(true)
const isLeaving = ref(false)
const loading = ref(false)

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'btn-danger'
    case 'warning':
      return 'btn-warning'
    case 'info':
      return 'btn-primary'
    default:
      return 'btn-primary'
  }
})

const handleCancel = () => {
  if (loading.value) return
  
  isLeaving.value = true
  setTimeout(() => {
    emit('cancel')
    emit('close', false)
  }, 200)
}

const handleConfirm = async () => {
  if (loading.value) return
  
  if (props.asyncAction) {
    loading.value = true
    try {
      emit('confirm')
    } finally {
      loading.value = false
    }
  } else {
    isLeaving.value = true
    setTimeout(() => {
      emit('confirm')
      emit('close', true)
    }, 200)
  }
}

onMounted(() => {
  setTimeout(() => {
    isEntering.value = false
  }, 50)
})

// 暴露关闭方法
defineExpose({
  close: handleCancel
})
</script>

<style scoped>
.confirm-dialog {
  background: var(--modal-bg);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--modal-shadow);
  min-width: 400px;
  max-width: 500px;
  transition: all var(--transition-normal);
  transform: scale(0.95);
  opacity: 0;
}

.confirm-dialog:not(.confirm-entering):not(.confirm-leaving) {
  transform: scale(1);
  opacity: 1;
}

.confirm-entering {
  transform: scale(0.95);
  opacity: 0;
}

.confirm-leaving {
  transform: scale(0.95);
  opacity: 0;
}

.confirm-icon {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
}

.confirm-icon span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  font-size: 32px;
  font-weight: bold;
}

.icon-danger {
  background: var(--btn-danger-bg);
  color: var(--btn-danger-color);
  border: 2px solid var(--btn-danger-border);
}

.icon-warning {
  background: var(--btn-warning-bg);
  color: var(--btn-warning-color);
  border: 2px solid var(--btn-warning-border);
}

.icon-info {
  background: var(--btn-success-bg);
  color: var(--btn-success-color);
  border: 2px solid var(--btn-success-border);
}

.icon-question {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  border: 2px solid var(--btn-secondary-border);
}

.confirm-content {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.confirm-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.confirm-message {
  margin: 0;
  font-size: var(--font-base);
  color: var(--text-secondary);
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

.confirm-cancel,
.confirm-confirm {
  padding: var(--spacing-md) var(--spacing-xl);
  min-width: 100px;
  font-weight: 500;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: var(--spacing-sm);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .confirm-dialog {
    min-width: auto;
    max-width: calc(100vw - var(--spacing-xl));
    margin: var(--spacing-md);
  }
  
  .confirm-actions {
    flex-direction: column;
  }
  
  .confirm-cancel,
  .confirm-confirm {
    width: 100%;
  }
}
</style>