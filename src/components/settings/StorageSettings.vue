<template>
  <div class="settings-section">
    <h3 class="section-title">{{ $t('settings.storage.title') }}</h3>
    <div class="setting-item">
      <label class="setting-label">{{ $t('settings.storage.path') }}</label>
      <div class="storage-path">
        <span class="path-text">{{ storagePath || $t('settings.storage.loading') }}</span>
        <button @click="selectStoragePath" class="path-btn">
          {{ $t('settings.storage.change') }}
        </button>
      </div>
    </div>
    <div class="setting-item">
      <button @click="resetStoragePath" class="reset-btn">
        {{ $t('settings.storage.reset') }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUIStore } from '@/stores'

export default {
  name: 'StorageSettings',
  emits: ['pathChanged'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const uiStore = useUIStore()
    
    const storagePath = ref('')
    
    // 更新存储路径显示
    const updateStoragePath = async () => {
      try {
        await uiStore.updateStoragePath()
        storagePath.value = uiStore.storagePath
        emit('pathChanged', storagePath.value)
      } catch (error) {
        console.error('获取存储路径失败:', error)
        storagePath.value = t('settings.storage.failed')
      }
    }
    
    // 选择存储路径
    const selectStoragePath = async () => {
      try {
        await uiStore.selectStorageDirectory()
        storagePath.value = uiStore.storagePath
        emit('pathChanged', storagePath.value)
      } catch (error) {
        console.error('选择存储目录失败:', error)
        alert(t('settings.storage.selectFailed'))
      }
    }
    
    // 重置存储路径
    const resetStoragePath = async () => {
      try {
        await uiStore.resetStorageDirectory()
        storagePath.value = uiStore.storagePath
        emit('pathChanged', storagePath.value)
      } catch (error) {
        console.error('重置存储目录失败:', error)
        alert(t('settings.storage.resetFailed'))
      }
    }
    
    // 初始化时更新存储路径
    updateStoragePath()
    
    return {
      storagePath,
      selectStoragePath,
      resetStoragePath
    }
  }
}
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
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 1rem;
}

.storage-path {
  display: flex;
  align-items: center;
  gap: 12px;
}

.path-text {
  flex: 1;
  padding: 10px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.path-btn,
.reset-btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.path-btn {
  background: var(--accent-color);
  color: white;
}

.path-btn:hover {
  opacity: 0.9;
}

.reset-btn {
  background: var(--reset-btn-bg);
  color: var(--reset-btn-color);
  width: fit-content;
}

.reset-btn:hover {
  background: var(--reset-btn-hover-bg);
}
</style>