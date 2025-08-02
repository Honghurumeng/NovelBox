<template>
  <div class="settings-section">
    <h2 class="section-title">AI功能</h2>
    
    <!-- 文本重写模型配置 -->
    <div class="setting-item">
      <label class="setting-label">文本重写模型</label>
      
      <div v-if="availableProviders.length === 0" class="no-providers-warning">
        未配置提供商。请先在提供商设置中配置。
      </div>
      
      <div v-else class="model-config">
        <!-- 选择提供商 -->
        <div class="config-field">
          <label class="field-label">选择提供商</label>
          <select 
            v-model="selectedProvider" 
            class="setting-select"
            @change="onProviderChange"
          >
            <option value="">选择提供商</option>
            <option 
              v-for="provider in availableProviders" 
              :key="provider.key"
              :value="provider.key"
            >
              {{ provider.name }} ({{ provider.type }})
            </option>
          </select>
        </div>

        <!-- 选择模型 -->
        <div v-if="selectedProvider" class="config-field">
          <label class="field-label">选择模型</label>
          <select 
            v-model="selectedModel" 
            class="setting-select"
            @change="onModelChange"
          >
            <option value="">选择模型</option>
            <option 
              v-for="model in availableModels" 
              :key="model.id || model.name"
              :value="model.id || model.name"
            >
              {{ model.displayName || model.id || model.name }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { llmService } from '@/services'

const selectedProvider = ref('')
const selectedModel = ref('')
const availableProviders = ref([])

// 获取当前选择的提供商的可用模型
const availableModels = computed(() => {
  if (!selectedProvider.value) return []
  return llmService.getProviderModels(selectedProvider.value)
})

// 加载可用的提供商
const loadProviders = () => {
  availableProviders.value = llmService.getAvailableProviders()
}

// 加载已保存的配置
const loadSavedConfig = () => {
  try {
    const savedConfig = localStorage.getItem('novelbox-rewrite-config')
    if (savedConfig) {
      const config = JSON.parse(savedConfig)
      selectedProvider.value = config.provider || ''
      selectedModel.value = config.model || ''
    }
  } catch (error) {
    console.error('Failed to load rewrite config:', error)
  }
}

// 保存配置
const saveConfig = () => {
  try {
    const config = {
      provider: selectedProvider.value,
      model: selectedModel.value
    }
    localStorage.setItem('novelbox-rewrite-config', JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save rewrite config:', error)
  }
}

// 提供商变更处理
const onProviderChange = () => {
  selectedModel.value = '' // 重置模型选择
  saveConfig()
}

// 模型变更处理
const onModelChange = () => {
  saveConfig()
}

onMounted(() => {
  loadProviders()
  loadSavedConfig()
  
  // 监听提供商变化，重新加载
  const handleStorageChange = (e) => {
    if (e.key === 'novelbox-providers') {
      llmService.reloadProviders()
      loadProviders()
    }
  }
  
  const handleProvidersUpdated = () => {
    llmService.reloadProviders()
    loadProviders()
  }
  
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('providers-updated', handleProvidersUpdated)
  
  // 在组件卸载时移除事件监听器
  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener('providers-updated', handleProvidersUpdated)
  })
})
</script>

<style scoped>
.settings-section {
  max-width: 800px;
}

.section-title {
  margin: 0 0 24px 0;
  font-size: 1.5rem;
  color: var(--text-primary);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.setting-item {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
}

.setting-label {
  font-weight: 500;
  margin-bottom: 16px;
  color: var(--text-primary);
  font-size: 1rem;
}

.no-providers-warning {
  padding: 16px;
  background: var(--warning-bg);
  color: var(--warning-color);
  border: 1px solid var(--warning-border);
  border-radius: 6px;
  font-size: 0.9rem;
}

.model-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.setting-select {
  width: 300px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s;
}

.setting-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.setting-select:hover {
  border-color: var(--accent-color);
}

/* 警告样式变量定义 */
:root {
  --warning-bg: #fff3cd;
  --warning-color: #856404;
  --warning-border: #ffeaa7;
}

.theme-dark {
  --warning-bg: #2d2111;
  --warning-color: #ffecb3;
  --warning-border: #5d4e37;
}

.theme-oled {
  --warning-bg: #1a1600;
  --warning-color: #ffecb3;
  --warning-border: #3d3000;
}
</style>
