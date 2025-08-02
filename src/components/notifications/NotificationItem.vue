<template>
  <div class="notification-item" :class="[`notification-${notification.type}`, { 'notification-entering': isEntering, 'notification-leaving': isLeaving }]">
    <div class="notification-icon">
      <span v-if="notification.type === 'success'">✓</span>
      <span v-else-if="notification.type === 'error'">✗</span>
      <span v-else-if="notification.type === 'warning'">⚠</span>
      <span v-else>ℹ</span>
    </div>
    
    <div class="notification-content">
      <div v-if="notification.title" class="notification-title">
        {{ notification.title }}
      </div>
      <div class="notification-message">
        {{ notification.message }}
      </div>
    </div>
    
    <button 
      v-if="notification.showClose" 
      class="notification-close"
      @click="handleClose"
      title="关闭"
    >
      ×
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  notification: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const isEntering = ref(true)
const isLeaving = ref(false)

const handleClose = () => {
  isLeaving.value = true
  // 动画结束后再触发关闭事件
  setTimeout(() => {
    emit('close', props.notification.id)
  }, 300)
}

onMounted(() => {
  // 进入动画
  setTimeout(() => {
    isEntering.value = false
  }, 50)
})

// 暴露关闭方法供父组件调用
defineExpose({
  close: handleClose
})
</script>

<style scoped>
.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: var(--card-bg);
  border-left: 4px solid;
  min-width: 320px;
  max-width: 480px;
  position: relative;
  transition: all 0.3s ease;
  transform: translateX(100%);
  opacity: 0;
}

.notification-item:not(.notification-entering):not(.notification-leaving) {
  transform: translateX(0);
  opacity: 1;
}

.notification-entering {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leaving {
  transform: translateX(100%);
  opacity: 0;
}

.notification-success {
  border-left-color: #22c55e;
}

.notification-error {
  border-left-color: #ef4444;
}

.notification-warning {
  border-left-color: #f59e0b;
}

.notification-info {
  border-left-color: #3b82f6;
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 12px;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.notification-success .notification-icon {
  background: #dcfce7;
  color: #166534;
}

.notification-error .notification-icon {
  background: #fef2f2;
  color: #dc2626;
}

.notification-warning .notification-icon {
  background: #fef3c7;
  color: #d97706;
}

.notification-info .notification-icon {
  background: #dbeafe;
  color: #2563eb;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  font-size: 14px;
}

.notification-message {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.notification-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-left: 8px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.notification-close:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
}

/* 深色主题适配 */
.theme-dark .notification-item {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.theme-dark .notification-success .notification-icon {
  background: #064e3b;
  color: #22c55e;
}

.theme-dark .notification-error .notification-icon {
  background: #7f1d1d;
  color: #ef4444;
}

.theme-dark .notification-warning .notification-icon {
  background: #78350f;
  color: #f59e0b;
}

.theme-dark .notification-info .notification-icon {
  background: #1e3a8a;
  color: #3b82f6;
}
</style>