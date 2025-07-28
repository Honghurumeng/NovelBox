<template>
  <div class="language-switcher">
    <button class="toggle-btn" @click="toggleDropdown">
      {{ currentLocaleName }}
      <svg style="width: 24px;height: 24px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
    <div v-if="isDropdownOpen" class="dropdown-menu">
      <div v-for="locale in availableLocales" :key="locale.code" class="dropdown-item"
        @click="selectLocale(locale.code)">
        {{ locale.name }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'LanguageSwitcher',
  setup() {
    const { locale } = useI18n()

    const availableLocales = [
      { code: 'zh', name: '中文' },
      { code: 'en', name: 'English' }
    ]

    const currentLocale = ref(locale.value)
    const isDropdownOpen = ref(false)

    const currentLocaleName = computed(() => {
      const selectedLocale = availableLocales.find(loc => loc.code === currentLocale.value)
      return selectedLocale ? selectedLocale.name : ''
    })

    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value
    }

    const selectLocale = (code) => {
      locale.value = code
      currentLocale.value = code
      localStorage.setItem('novelbox-locale', code)
      isDropdownOpen.value = false
    }

    return {
      currentLocale,
      availableLocales,
      currentLocaleName,
      isDropdownOpen,
      toggleDropdown,
      selectLocale
    }
  }
}
</script>

<style scoped>
.language-switcher {
  position: relative;
  display: inline-block;
}

.toggle-btn {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  gap: 6px;
  transition: all 0.2s;
  width: fit-content;
  height: 46.5px;
  align-items: center;
}

.toggle-btn:hover {
  background: var(--nav-hover-bg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--modal-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  margin-top: 4px;
  min-width: 120px;
  z-index: 100;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-primary);
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: var(--nav-hover-bg);
}
</style>