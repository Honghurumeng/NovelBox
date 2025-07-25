<template>
  <div class="editor-page">
    <div class="editor-container">
      <!-- 左侧栏 - 章节列表 -->
      <ChaptersList />
      
      <!-- 中间编辑区域 -->
      <MainEditor />
      
      <!-- 右侧栏 - AI工具 -->
      <AIPanel />
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNovelsStore, useChaptersStore } from '@/stores'
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

    return {}
  }
}
</script>

<style scoped>
.editor-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.editor-container {
  display: flex;
  height: 100%;
  background: #f8f9fa;
}
</style>