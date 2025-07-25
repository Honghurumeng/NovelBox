/**
 * Electron API Service - handles communication with Electron main process
 */

export class ElectronStorageService {
  static async loadNovels() {
    try {
      return await window.electronAPI.storage.loadNovels()
    } catch (error) {
      console.error('Failed to load novels:', error)
      return { success: false, error: error.message }
    }
  }

  static async saveNovels(novels) {
    try {
      return await window.electronAPI.storage.saveNovels(novels)
    } catch (error) {
      console.error('Failed to save novels:', error)
      return { success: false, error: error.message }
    }
  }

  static async getCurrentPath() {
    try {
      return await window.electronAPI.storage.getCurrentPath()
    } catch (error) {
      console.error('Failed to get current path:', error)
      throw error
    }
  }

  static async selectDirectory() {
    try {
      return await window.electronAPI.storage.selectDirectory()
    } catch (error) {
      console.error('Failed to select directory:', error)
      throw error
    }
  }

  static async resetToDefault() {
    try {
      return await window.electronAPI.storage.resetToDefault()
    } catch (error) {
      console.error('Failed to reset to default:', error)
      throw error
    }
  }
}