import { createPinia } from 'pinia'

// Create pinia instance
export const pinia = createPinia()

// Export stores
export { useNovelsStore } from './novels'
export { useChaptersStore } from './chapters'
export { useUIStore } from './ui'
export { useNotificationsStore } from './notifications'