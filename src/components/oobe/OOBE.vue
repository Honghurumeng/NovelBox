<template>
  <div class="oobe-overlay" v-if="showOOBE">
    <div class="oobe-container">
      <div class="oobe-content">
        <!-- 第一页：欢迎页面 -->
        <div v-if="currentPage === 1" class="oobe-page">
          <div class="oobe-logo">📚</div>
          <h1>NovelBox</h1>
          <p class="subtitle">{{ $t('oobe.page1.subtitle') }}</p>
          
          <div class="language-selector">
            <label>{{ $t('oobe.page1.language') }}</label>
            <select v-model="selectedLocale" @change="changeLocale" class="language-select">
              <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">
                {{ locale.name }}
              </option>
            </select>
          </div>
          
          <div class="oobe-navigation">
            <button @click="nextPage" class="next-btn">{{ $t('oobe.next') }}</button>
          </div>
        </div>
        
        <!-- 第二页：跨平台支持 -->
        <div v-else-if="currentPage === 2" class="oobe-page">
          <div class="feature-icon">💻</div>
          <h2>{{ $t('oobe.page2.title') }}</h2>
          <p class="feature-description">{{ $t('oobe.page2.description') }}</p>
          
          <div class="tech-stack">
            <span class="tech-item">Electron</span>
            <span class="tech-item">Vue.js</span>
            <span class="tech-item">Pinia</span>
          </div>
          
          <div class="oobe-navigation">
            <button @click="prevPage" class="prev-btn">{{ $t('oobe.previous') }}</button>
            <button @click="nextPage" class="next-btn">{{ $t('oobe.next') }}</button>
          </div>
        </div>
        
        <!-- 第三页：开源 -->
        <div v-else-if="currentPage === 3" class="oobe-page">
          <div class="feature-icon">🔓</div>
          <h2>{{ $t('oobe.page3.title') }}</h2>
          <p class="feature-description">{{ $t('oobe.page3.description') }}</p>
          
          <ul class="features-list">
            <li>{{ $t('oobe.page3.feature1') }}</li>
            <li>{{ $t('oobe.page3.feature2') }}</li>
          </ul>
          
          <div class="oobe-navigation">
            <button @click="prevPage" class="prev-btn">{{ $t('oobe.previous') }}</button>
            <button @click="finishOOBE" class="finish-btn">{{ $t('oobe.finish') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'OOBE',
  setup() {
    const { t, locale } = useI18n()
    
    const showOOBE = ref(false)
    const currentPage = ref(1)
    const selectedLocale = ref(locale.value)
    
    const availableLocales = [
      { code: 'zh', name: '中文' },
      { code: 'en', name: 'English' }
    ]
    
    // 检查是否需要显示OOBE
    onMounted(() => {
      const hasCompletedOOBE = localStorage.getItem('novelbox-oobe-completed')
      if (!hasCompletedOOBE) {
        showOOBE.value = true
      }
    })
    
    const changeLocale = () => {
      locale.value = selectedLocale.value
      localStorage.setItem('novelbox-locale', selectedLocale.value)
    }
    
    const nextPage = () => {
      if (currentPage.value < 3) {
        currentPage.value++
      }
    }
    
    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
      }
    }
    
    const finishOOBE = () => {
      localStorage.setItem('novelbox-oobe-completed', 'true')
      showOOBE.value = false
    }
    
    return {
      showOOBE,
      currentPage,
      selectedLocale,
      availableLocales,
      changeLocale,
      nextPage,
      prevPage,
      finishOOBE
    }
  }
}
</script>

<style scoped>
.oobe-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.oobe-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
}

.oobe-content {
  padding: 40px;
  text-align: center;
}

.oobe-page {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.oobe-logo {
  font-size: 4rem;
  margin-bottom: 20px;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

h1 {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  color: #333;
}

h2 {
  font-size: 1.8rem;
  margin: 0 0 20px 0;
  color: #333;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 30px;
}

.feature-description {
  font-size: 1.1rem;
  color: #555;
  line-height: 1.6;
  margin-bottom: 30px;
}

.language-selector {
  margin: 30px 0;
}

.language-selector label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #333;
}

.language-select {
  padding: 12px 20px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.language-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.tech-stack {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
  margin: 30px 0;
}

.tech-item {
  background: #f1f5f9;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #334155;
}

.features-list {
  text-align: left;
  margin: 30px 0;
  padding: 0 20px;
}

.features-list li {
  margin: 15px 0;
  font-size: 1rem;
  color: #555;
}

.oobe-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.prev-btn,
.next-btn,
.finish-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.prev-btn {
  background: #f1f5f9;
  color: #334155;
}

.prev-btn:hover {
  background: #e2e8f0;
}

.next-btn,
.finish-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.next-btn:hover,
.finish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.finish-btn {
  min-width: 120px;
}
</style>