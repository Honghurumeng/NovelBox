import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    leftSidebarCollapsed: false,
    rightSidebarCollapsed: false
  }),
  actions: {
    toggleLeftSidebar() {
      this.leftSidebarCollapsed = !this.leftSidebarCollapsed
    },
    toggleRightSidebar() {
      this.rightSidebarCollapsed = !this.rightSidebarCollapsed
    }
  }
})
<template>
  <div class="editor-page">
    <!-- 左侧栏 - 章节列表 -->
    <div 
      class="left-sidebar" 
      :class="{ collapsed: uiStore.leftSidebarCollapsed }"
    >
      <button 
        class="toggle-left-sidebar" 
        @click="uiStore.toggleLeftSidebar()"
      >
        {{ uiStore.leftSidebarCollapsed ? '›' : '‹' }}
      </button>
      
      <ChaptersList v-show="!uiStore.leftSidebarCollapsed" />
    </div>
    
    <!-- 主编辑区域 -->
    <div 
      class="main-content"
      :class="{
        'left-collapsed': uiStore.leftSidebarCollapsed,
        'right-collapsed': uiStore.rightSidebarCollapsed
      }"
    >
      <MainEditor />
    </div>
    
    <!-- 右侧栏 - AI工具 -->
    <div 
      class="right-sidebar" 
      :class="{ collapsed: uiStore.rightSidebarCollapsed }"
    >
      <button 
        class="toggle-right-sidebar" 
        @click="uiStore.toggleRightSidebar()"
      >
        {{ uiStore.rightSidebarCollapsed ? '‹' : '›' }}
      </button>
      
      <AIPanel v-show="!uiStore.rightSidebarCollapsed" />
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNovelsStore, useChaptersStore, useUIStore } from '@/stores'
import ChaptersList from '@/components/editor/ChaptersList.vue'
import MainEditor from '@/components/editor/MainEditor.vue'
import AIPanel from '@/components/editor/AIPanel.vue'

export default {
  name: 'EditorPage',
  components: {
    ChaptersList,
    MainEditor,
    AIPanel
  },
  props: {
    novelId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const novelsStore = useNovelsStore()
    const chaptersStore = useChaptersStore()
    const uiStore = useUIStore()

    const init = async () => {
      // Load novels if not already loaded
      if (!novelsStore.hasNovels) {
        await novelsStore.loadNovels()
      }

      // Set current novel
      const novel = novelsStore.novels.find(n => n.id === props.novelId)
      if (!novel) {
        // Novel not found, redirect to homepage
        router.push('/')
        return
      }

      novelsStore.setCurrentNovel(props.novelId)

      // Open first chapter if available
      if (novel.chapters.length > 0) {
        await chaptersStore.openChapter(novel.chapters[0].id)
      }
    }

    const cleanup = async () => {
      // Save before leaving
      if (chaptersStore.currentChapter) {
        await novelsStore.saveNovels()
      }
      
      // Clear state
      chaptersStore.clearCurrentChapter()
      novelsStore.clearCurrentNovel()
    }

    onMounted(() => {
      init()
    })

    onUnmounted(() => {
      cleanup()
    })

    return {
      uiStore
    }
  }
}
</script>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: row;
  height: 100vh;
  background: var(--bg-color);
  overflow: hidden;
}

/* 左侧边栏样式 */
.left-sidebar {
  position: relative;
  width: 300px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  z-index: 100;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.left-sidebar.collapsed {
  width: 50px;
}

.toggle-left-sidebar {
  position: absolute;
  top: 50%;
  right: -10px;
  transform: translateY(-50%);
  width: 24px;
  height: 40px;
  background: var(--btn-primary-bg);
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 101;
  transition: all 0.2s;
}

.toggle-left-sidebar:hover {
  opacity: 0.9;
}

/* 右侧边栏样式 */
.right-sidebar {
  position: relative;
  width: 350px;
  background: var(--sidebar-bg);
  border-left: 1px solid var(--border-color);
  z-index: 100;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.right-sidebar.collapsed {
  width: 50px;
}

.toggle-right-sidebar {
  position: absolute;
  top: 50%;
  left: -10px;
  transform: translateY(-50%);
  width: 24px;
  height: 40px;
  background: var(--btn-primary-bg);
  color: white;
  border: none;
  border-radius: 4px 0 0 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 101;
  transition: all 0.2s;
}

.toggle-right-sidebar:hover {
  opacity: 0.9;
}

/* 主编辑区域样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-content.left-collapsed {
  margin-left: 50px;
}

.main-content.right-collapsed {
  margin-right: 50px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .left-sidebar {
    width: 250px;
  }
  
  .right-sidebar {
    width: 300px;
  }
}
</style>