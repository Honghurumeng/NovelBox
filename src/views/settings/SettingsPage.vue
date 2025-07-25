<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- 左侧导航 -->
      <div class="settings-sidebar">
        <div class="sidebar-header">
          <h2 class="sidebar-title">{{ $t('settings.title') }}</h2>
          <button class="back-btn" @click="goToHome" :title="$t('settings.backToHome')">
            ←
          </button>
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
        <div v-if="activeCategory === 'language'" class="settings-section">
          <h3 class="section-title">{{ $t('settings.language.title') }}</h3>
          <div class="setting-item">
            <label class="setting-label">{{ $t('settings.language.interface') }}</label>
            <select 
              v-model="selectedLocale" 
              @change="changeLocale" 
              class="setting-select"
            >
              <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">
                {{ locale.name }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- 主题设置 -->
        <div v-else-if="activeCategory === 'appearance'" class="settings-section">
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
        
        <!-- 存储设置 -->
        <div v-else-if="activeCategory === 'storage'" class="settings-section">
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

        <div v-else-if="activeCategory === 'developer'" class="settings-section">
          <h3 class="section-title">{{ $t('settings.developer.title') }}</h3>
          <div class="setting-item">
           <button @click="resetOOBE" class="reset-btn">
              {{ $t('settings.developer.resetoobe') }}
            </button>
          </div>
        </div>

        <!-- 关于页面 -->
        <div v-else-if="activeCategory === 'about'" class="settings-section about-section">
          <div class="about-content">
            <div class="app-info">
              <h1 class="app-name">{{ $t('about.appName') }}</h1>
              <p class="app-description">{{ $t('about.appDescription') }}</p>
              <p class="app-version">{{ $t('about.version', { version: '1.0.0' }) }}</p>
            </div>
            
            <div class="links">
              <div class="link-item">
                <span class="link-label">{{ $t('about.github') }}：</span>
                <a href="https://github.com/AliyahZombie/NovelBox" target="_blank" class="link-url">
                  https://github.com/AliyahZombie/NovelBox
                </a>
              </div>
              <div class="link-item">
                <span class="link-label">{{ $t('about.contact') }}：</span>
                <a href="mailto:aliyahzombie2024@gmail.com" class="link-url">
                  aliyahzombie2024@gmail.com
                </a>
              </div>
              <div class="link-item">
                <span class="link-label">{{ $t('about.license') }}: </span>
                <span class="link-url">AGPL-3.0</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUIStore } from '@/stores'
import { useRouter } from 'vue-router'

export default {
  name: 'SettingsPage',
  setup() {
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
      { id: 'developer', label: 'settings.developer.title', icon: '⚙️' },
      { id: 'about', label: 'about.title', icon: 'ℹ️' }
    ]
    
    // 语言选项
    const availableLocales = [
      { code: 'zh', name: '中文' },
      { code: 'en', name: 'English' }
    ]
    
    // 主题选项
    const themes = [
      { id: 'light', name: 'settings.appearance.themes.light' },
      { id: 'dark', name: 'settings.appearance.themes.dark' },
      { id: 'oled', name: 'settings.appearance.themes.oled' },
      { id: 'blue', name: 'settings.appearance.themes.blue' },
      { id: 'green', name: 'settings.appearance.themes.green' },
      { id: 'purple', name: 'settings.appearance.themes.purple' }
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
      
      // 获取存储路径
      await updateStoragePath()
    })
    
    const resetOOBE = async() => {
      localStorage.removeItem('novelbox-oobe-completed')
      // refresh page
      window.location.reload()
    }
    // 更新存储路径显示
    const updateStoragePath = async () => {
      try {
        await uiStore.updateStoragePath()
        storagePath.value = uiStore.storagePath
      } catch (error) {
        console.error('获取存储路径失败:', error)
        storagePath.value = t('settings.storage.failed')
      }
    }
    
    // 更改语言
    const changeLocale = () => {
      locale.value = selectedLocale.value
      localStorage.setItem('novelbox-locale', selectedLocale.value)
    }
    
    // 更改主题
    const changeTheme = (themeId) => {
      selectedTheme.value = themeId
      localStorage.setItem('novelbox-theme', themeId)
      applyTheme(themeId)
    }
    
    // 应用主题
    const applyTheme = (themeId) => {
      document.body.className = `theme-${themeId}`
    }
    
    // 选择存储路径
    const selectStoragePath = async () => {
      try {
        await uiStore.selectStorageDirectory()
        storagePath.value = uiStore.storagePath
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
      } catch (error) {
        console.error('重置存储目录失败:', error)
        alert(t('settings.storage.resetFailed'))
      }
    }
    
    return {
      activeCategory,
      selectedLocale,
      selectedTheme,
      storagePath,
      categories,
      availableLocales,
      themes,
      changeLocale,
      changeTheme,
      selectStoragePath,
      resetStoragePath,
      goToHome,
      resetOOBE
    }
  }
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