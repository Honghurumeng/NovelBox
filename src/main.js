import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import i18n from './locales/i18n'

// Import global styles
import './styles/global.css'

// Create Vue app
const app = createApp(App)

// Use plugins
app.use(pinia)
app.use(router)
app.use(i18n)

// Apply saved theme on app start
const savedTheme = localStorage.getItem('novelbox-theme') || 'light'
document.body.className = `theme-${savedTheme}`

// Mount app
app.mount('#app')

console.log('NovelBox Vue.js application initialized')