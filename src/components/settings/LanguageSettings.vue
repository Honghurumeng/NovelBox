<template>
  <div class="settings-section">
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
</template>

<script>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'LanguageSettings',
  emits: ['localeChanged'],
  setup(props, { emit }) {
    const { locale } = useI18n()
    
    const selectedLocale = ref(locale.value)
    
    // 语言选项
    const availableLocales = [
      { code: 'zh', name: '中文' },
      { code: 'en', name: 'English' }
    ]
    
    // 更改语言
    const changeLocale = () => {
      locale.value = selectedLocale.value
      localStorage.setItem('novelbox-locale', selectedLocale.value)
      emit('localeChanged', selectedLocale.value)
    }
    
    return {
      selectedLocale,
      availableLocales,
      changeLocale
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
</style>