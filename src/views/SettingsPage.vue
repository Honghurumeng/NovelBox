<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- 左侧导航 -->
      <div class="settings-sidebar">
        <div class="sidebar-header">
          <button class="back-btn" @click="goToHome" :title="$t('settings.backToHome')">
            ←
          </button>
          <h2 class="sidebar-title">{{ $t('settings.title') }}</h2>
        </div>
        <ul class="settings-nav">
          <li 
            v-for="category in categories" 
            :key="category.id"
            class="nav-item"
            :class="{ active: activeCategory === category.id }"
            @click="activeCategory = category.id"
          >
            <span class="nav-icon">{{ category.icon }}</span>
            <span class="nav-label">{{ $t(category.label) }}</span>
          </li>
        </ul>
      </div>
      
      <!-- 右侧内容 -->
      <div class="settings-content">
        <!-- 语言设置 -->
        <LanguageSettings 
          v-if="activeCategory === 'language'" 
          @locale-changed="handleLocaleChange"
        />
        
        <!-- 主题设置 -->
        <AppearanceSettings 
          v-else-if="activeCategory === 'appearance'" 
          @theme-changed="handleThemeChange"
        />
        
        <!-- 存储设置 -->
        <StorageSettings 
          v-else-if="activeCategory === 'storage'" 
          @path-changed="handlePathChange"
        />
        
        <!-- 提供商设置 -->
        <ProviderSettings 
          v-else-if="activeCategory === 'provider'" 
        />
        
        <!-- AI功能设置 -->
        <ModelConfigSettings 
          v-else-if="activeCategory === 'aiFeatures'" 
        />
        
        <!-- 开发者设置 -->
        <DeveloperSettings 
          v-else-if="activeCategory === 'developer'" 
          @reset-o-o-b-e="resetOOBE"
        />

        <!-- 关于页面 -->
        <AboutSection v-else-if="activeCategory === 'about'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUIStore } from '@/stores'
import { useRouter } from 'vue-router'
import LanguageSettings from '@/components/settings/LanguageSettings.vue'
import AppearanceSettings from '@/components/settings/AppearanceSettings.vue'
import StorageSettings from '@/components/settings/StorageSettings.vue'
import ProviderSettings from '@/components/settings/ProviderSettings.vue'
import ModelConfigSettings from '@/components/settings/ModelConfigSettings.vue'
import DeveloperSettings from '@/components/settings/DeveloperSettings.vue'
import AboutSection from '@/components/settings/AboutSection.vue'

const { t, locale } = useI18n()
const uiStore = useUIStore()
const router = useRouter()

const activeCategory = ref('language')
const selectedLocale = ref(locale.value)
const selectedTheme = ref('light')
const storagePath = ref('')

// 设置分类
const categories = [
  { id: 'language', label: 'settings.language.title', icon: '🌐' },
  { id: 'appearance', label: 'settings.appearance.title', icon: '🎨' },
  { id: 'storage', label: 'settings.storage.title', icon: '💾' },
  { id: 'provider', label: 'settings.provider.title', icon: '🔌' },
  { id: 'aiFeatures', label: 'settings.aiFeatures.title', icon: '🤖' },
  { id: 'developer', label: 'settings.developer.title', icon: '⚙️' },
  { id: 'about', label: 'about.title', icon: 'ℹ️' }
]

// 返回主页
const goToHome = () => {
  router.push('/')
}

// 初始化设置
onMounted(async () => {
  // 获取当前主题
  const savedTheme = localStorage.getItem('novelbox-theme') || 'light'
  selectedTheme.value = savedTheme
  applyTheme(savedTheme)
})

const resetOOBE = () => {
  localStorage.removeItem('novelbox-oobe-completed')
  // refresh page
  window.location.reload()
}

// 应用主题
const applyTheme = (themeId) => {
  document.body.className = `theme-${themeId}`
}

// 处理语言变更
const handleLocaleChange = (newLocale) => {
  selectedLocale.value = newLocale
}

// 处理主题变更
const handleThemeChange = (themeId) => {
  selectedTheme.value = themeId
  applyTheme(themeId)
}

// 处理路径变更
const handlePathChange = (newPath) => {
  storagePath.value = newPath
}
</script>

<style scoped>
.settings-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-color);
}

.settings-container {
  display: flex;
  height: 100%;
}

.settings-sidebar {
  width: 250px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  padding: 0;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
}

.settings-nav {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.nav-item:hover {
  background: var(--nav-hover-bg);
}

.nav-item.active {
  background: var(--nav-active-bg);
  color: var(--nav-active-color);
  font-weight: 500;
}

.nav-icon {
  font-size: 1.2rem;
  margin-right: 12px;
}

.settings-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--content-bg);
}

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

.setting-select {
  width: 300px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 1rem;
}

.setting-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-shadow);
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

.about-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.about-content {
  text-align: center;
  max-width: 600px;
  padding: 2rem;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

.app-name {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
  background: var(--accent-color);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-description {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
}

.app-version {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.links {
  text-align: left;
  margin-top: 2rem;
}

.link-item {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.link-label {
  font-weight: 500;
  color: var(--text-primary);
  min-width: 100px;
}

.link-url {
  color: var(--accent-color);
  text-decoration: none;
  word-break: break-all;
}

.link-url:hover {
  text-decoration: underline;
}
</style>