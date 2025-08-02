<template>
  <div class="homepage">
    <header class="header">
      <h1>我的小说</h1>
      <div class="header-actions">
        <button class="btn btn-primary settings-btn" @click="goToSettings">
          设置
        </button>
        <button class="btn btn-primary new-novel-btn" @click="showNewNovelModal">
          创建新小说
        </button>
      </div>
    </header>
    
    <div class="search-bar">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="搜索小说..."
        class="search-input"
      >
    </div>
    
    <div class="novels-grid">
      <div 
        v-for="novel in filteredNovels" 
        :key="novel.id"
        class="novel-card"
      >
        <div class="novel-info">
          <h3 class="novel-title">{{ novel.name }}</h3>
          <p class="novel-author">by {{ novel.author }}</p>
          <p class="novel-description">{{ novel.description }}</p>
          <div class="novel-meta">
            <span class="chapter-count">{{ novel.chapters.length }} 章</span>
            <span class="word-count">{{ formatTotalWordCount(novel) }}</span>
          </div>
        </div>
        
        <div class="novel-actions">
          <button class="btn btn-secondary edit-btn" @click="editNovel(novel)">
            编辑
          </button>
          <button class="btn btn-danger delete-btn" @click="promptDeleteNovel(novel)">
            删除
          </button>
          <button class="btn btn-info export-btn" @click="exportNovel(novel)">
            导出小说
          </button>
          <button class="btn btn-success open-btn" @click="openNovel(novel)">
            打开小说
          </button>
        </div>
      </div>
      
      <div v-if="filteredNovels.length === 0" class="no-novels">
        <p>还没有小说，点击"创建新小说"开始创作吧！</p>
      </div>
    </div>
    
    <!-- Modals -->
    <NewNovelModal 
      v-if="uiStore.showNewNovelModal"
      @close="uiStore.closeNewNovelModal"
      @create="createNovel"
    />
    
    <EditNovelModal 
      v-if="uiStore.showEditNovelModal"
      :novel="uiStore.editNovelData"
      @close="uiStore.closeEditNovelModal"
      @update="updateNovel"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelsStore, useUIStore } from '@/stores'
import { UtilsService, notificationService, confirmService } from '@/services'
import NewNovelModal from '@/components/modals/NewNovelModal.vue'
import EditNovelModal from '@/components/modals/EditNovelModal.vue'

export default {
  name: 'Homepage',
  components: {
    NewNovelModal,
    EditNovelModal
  },
  setup() {
    const router = useRouter()
    const novelsStore = useNovelsStore()
    const uiStore = useUIStore()

    const searchQuery = ref('')
    
    const filteredNovels = computed(() => {
      if (!searchQuery.value) {
        return novelsStore.novels
      }
      
      const query = searchQuery.value.toLowerCase()
      return novelsStore.novels.filter(novel => 
        novel.name.toLowerCase().includes(query) ||
        novel.author.toLowerCase().includes(query) ||
        novel.description.toLowerCase().includes(query)
      )
    })
    
    const formatTotalWordCount = (novel) => {
      const total = novel.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
      return UtilsService.formatWordCount(total)
    }
    
    const showNewNovelModal = () => {
      uiStore.openNewNovelModal()
    }
    
    const createNovel = async (novelData) => {
      try {
        const novel = await novelsStore.createNovel(novelData)
        uiStore.closeNewNovelModal()
        router.push(`/editor/${novel.id}`)
      } catch (error) {
        console.error('创建小说失败:', error)
        notificationService.error('创建小说失败: ' + error.message)
      }
    }
    
    const editNovel = (novel) => {
      uiStore.editNovelData = novel
      uiStore.openEditNovelModal()
    }
    
    const updateNovel = async (novelId, novelData) => {
      try {
        await novelsStore.updateNovel(novelId, novelData)
        uiStore.closeEditNovelModal()
      } catch (error) {
        console.error('更新小说失败:', error)
        notificationService.error('更新小说失败: ' + error.message)
      }
    }
    
    const promptDeleteNovel = async (novel) => {
      const confirmed = await confirmService.delete(`小说《${novel.name}》`)
      if (!confirmed) return
      
      try {
        await novelsStore.deleteNovel(novel.id)
        notificationService.success('小说已删除')
      } catch (error) {
        console.error('删除小说失败:', error)
        notificationService.error('删除小说失败: ' + error.message)
      }
    }
    
    const openNovel = (novel) => {
      router.push(`/editor/${novel.id}`)
    }

    const exportNovel = (novel) => {
      try {
        // 生成txt格式的内容
        let content = `Author: ${novel.author}\n`
        content += `Desc: ${novel.description}\n\n`

        // 添加每个章节
        novel.chapters.forEach((chapter, index) => {
          content += `第${index + 1}章 ${chapter.title}\n`
          content += `${chapter.content}\n\n`
        })

        // 创建Blob对象
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })

        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${novel.name}.txt`

        // 触发下载
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // 清理URL对象
        URL.revokeObjectURL(url)

        // 显示成功消息
        notificationService.success('小说导出成功')
      } catch (error) {
        console.error('导出小说失败:', error)
        notificationService.error('导出失败：' + error.message)
      }
    }

    const goToSettings = () => {
      router.push('/settings')
    }
    
    // 在组件挂载时加载小说数据
    onMounted(async () => {
      if (!novelsStore.hasNovels) {
        await novelsStore.loadNovels()
      }
    })
    
    return {
      novelsStore,
      uiStore,
      searchQuery,
      filteredNovels,
      formatTotalWordCount,
      showNewNovelModal,
      createNovel,
      editNovel,
      updateNovel,
      promptDeleteNovel,
      openNovel,
      exportNovel,
      goToSettings
    }
  }
}
</script>

<style scoped>
.homepage {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
  background: var(--bg-color);
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.header h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-3xl);
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}


.search-bar {
  margin-bottom: var(--spacing-xl);
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: var(--font-base);
  transition: all var(--transition-normal);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-solid);
  box-shadow: 0 0 0 3px var(--accent-shadow);
}

.novels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.novel-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--card-shadow);
  transition: all var(--transition-normal);
  position: relative;
  overflow: visible;
}

.novel-title {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  font-size: var(--font-xl);
  font-weight: 600;
  line-height: 1.3;
}

.novel-author {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.novel-description {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--text-secondary);
  font-size: var(--font-sm);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.novel-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-xs);
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-top: 1px solid var(--border-color);
}

.novel-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.novel-actions .btn {
  flex: 1;
  text-align: center;
  font-size: var(--font-xs);
  padding: var(--spacing-sm);
}

/* 悬停效果增强 */
.novel-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-hover-shadow);
}

.novel-card:hover .novel-title {
  color: var(--accent-solid);
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
}

.empty-state h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-xl);
  color: var(--text-primary);
}

.empty-state p {
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-base);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .homepage {
    padding: var(--spacing-md);
  }
  
  .header {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .novels-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .novel-actions {
    flex-direction: column;
  }
  
  .novel-actions .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: var(--font-2xl);
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .header-actions .btn {
    width: 100%;
  }
}



.no-novels {
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px 0;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .novels-grid {
    grid-template-columns: 1fr;
  }
}

/* 删除确认模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--modal-bg);
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 420px;
  box-shadow: var(--card-shadow);
}

.modal-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
}

.modal-body {
  margin-bottom: 24px;
  color: var(--text-primary);
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

</style>
