import { createI18n } from 'vue-i18n'
import zh from './zh.json'
import en from './en.json'

// 定义支持的语言
const messages = {
  zh,
  en
}

// 自动检测浏览器语言
function getBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage
  if (browserLang.indexOf('zh') !== -1) {
    return 'zh'
  } else if (browserLang.indexOf('en') !== -1) {
    return 'en'
  }
  return 'en' // 默认语言
}

// 从localStorage获取语言设置，如果没有则使用浏览器语言
const savedLocale = localStorage.getItem('novelbox-locale')
const locale = savedLocale || getBrowserLanguage()

const i18n = createI18n({
  legacy: false, // 使用Composition API模式
  locale: locale,
  fallbackLocale: 'en',
  messages,
  globalInjection: true // 全局注入 $t 等方法
})

export default i18n