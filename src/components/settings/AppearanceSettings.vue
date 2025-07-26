<template>
  <div class="settings-section">
    <h3 class="section-title">{{ $t('settings.appearance.title') }}</h3>
    <div class="setting-item">
      <label class="setting-label">{{ $t('settings.appearance.theme') }}</label>
      <div class="theme-options">
        <div 
          v-for="theme in themes" 
          :key="theme.id"
          class="theme-option"
          :class="{ active: selectedTheme === theme.id }"
          @click="changeTheme(theme.id)"
        >
          <div class="theme-preview" :class="`theme-${theme.id}`">
            <div class="preview-header"></div>
            <div class="preview-content">
              <div class="preview-sidebar"></div>
              <div class="preview-main"></div>
            </div>
          </div>
          <span class="theme-name">{{ $t(theme.name) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'AppearanceSettings',
  emits: ['themeChanged'],
  setup(props, { emit }) {
    const selectedTheme = ref('light')
    
    // 主题选项
    const themes = [
      { id: 'light', name: 'settings.appearance.themes.light' },
      { id: 'dark', name: 'settings.appearance.themes.dark' },
      { id: 'oled', name: 'settings.appearance.themes.oled' },
      { id: 'blue', name: 'settings.appearance.themes.blue' },
      { id: 'green', name: 'settings.appearance.themes.green' },
      { id: 'purple', name: 'settings.appearance.themes.purple' }
    ]
    
    onMounted(() => {
      // 获取当前主题
      const savedTheme = localStorage.getItem('novelbox-theme') || 'light'
      selectedTheme.value = savedTheme
    })
    
    // 更改主题
    const changeTheme = (themeId) => {
      selectedTheme.value = themeId
      localStorage.setItem('novelbox-theme', themeId)
      emit('themeChanged', themeId)
    }
    
    return {
      selectedTheme,
      themes,
      changeTheme
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

.theme-options {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.theme-preview {
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.theme-option.active .theme-preview {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-color);
}

.theme-preview.theme-light {
  background: #ffffff;
}

.theme-preview.theme-light .preview-header {
  background: #f8f9fa;
  height: 20px;
}

.theme-preview.theme-light .preview-sidebar {
  background: #f1f3f5;
  width: 30px;
  height: 60px;
}

.theme-preview.theme-light .preview-main {
  background: #ffffff;
  flex: 1;
  height: 60px;
}

.theme-preview.theme-dark {
  background: #1e1e1e;
}

.theme-preview.theme-dark .preview-header {
  background: #2d2d2d;
  height: 20px;
}

.theme-preview.theme-dark .preview-sidebar {
  background: #252526;
  width: 30px;
  height: 60px;
}

.theme-preview.theme-dark .preview-main {
  background: #1e1e1e;
  flex: 1;
  height: 60px;
}

.theme-preview.theme-oled {
  background: #000000;
}

.theme-preview.theme-oled .preview-header {
  background: #000000;
  height: 20px;
}

.theme-preview.theme-oled .preview-sidebar {
  background: #000000;
  width: 30px;
  height: 60px;
  border-right: 1px solid #333;
}

.theme-preview.theme-oled .preview-main {
  background: #000000;
  flex: 1;
  height: 60px;
}

/* 蓝色主题预览 */
.theme-preview.theme-blue {
  background: #e3f2fd;
}

.theme-preview.theme-blue .preview-header {
  background: #bbdefb;
  height: 20px;
}

.theme-preview.theme-blue .preview-sidebar {
  background: #90caf9;
  width: 30px;
  height: 60px;
}

.theme-preview.theme-blue .preview-main {
  background: #e3f2fd;
  flex: 1;
  height: 60px;
}

/* 绿色主题预览 */
.theme-preview.theme-green {
  background: #e8f5e9;
}

.theme-preview.theme-green .preview-header {
  background: #c8e6c9;
  height: 20px;
}

.theme-preview.theme-green .preview-sidebar {
  background: #a5d6a7;
  width: 30px;
  height: 60px;
}

.theme-preview.theme-green .preview-main {
  background: #e8f5e9;
  flex: 1;
  height: 60px;
}

/* 紫色主题预览 */
.theme-preview.theme-purple {
  background: #f3e5f5;
}

.theme-preview.theme-purple .preview-header {
  background: #e1bee7;
  height: 20px;
}

.theme-preview.theme-purple .preview-sidebar {
  background: #ce93d8;
  width: 30px;
  height: 60px;
}

.theme-preview.theme-purple .preview-main {
  background: #f3e5f5;
  flex: 1;
  height: 60px;
}

.preview-content {
  display: flex;
  height: 60px;
}

.theme-name {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
</style>