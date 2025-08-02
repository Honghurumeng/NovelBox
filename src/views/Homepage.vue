<template>
  <div class="homepage">
    <header class="header">
      <h1>我的小说</h1>
      <div class="header-actions">
        <button class="settings-btn" @click="goToSettings">
          设置
        </button>
        <button class="new-novel-btn" @click="showNewNovelModal">
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
          <button class="btn edit-btn" @click="editNovel(novel)">
            编辑
          </button>
          <button class="btn delete-btn" @click="promptDeleteNovel(novel)">
            删除
          </button>
          <button class="btn export-btn" @click="exportNovel(novel)">
            导出小说
          </button>
          <button class="btn open-btn" @click="openNovel(novel)">
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
 
    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>删除 {{ deletingNovel?.name }}</h3>
          <button class="close-btn" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除这本小说吗？此操作无法撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteModal">取消</button>
          <button class="btn btn-danger" @click="confirmDeleteNovel">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelsStore, useUIStore } from '@/stores'
import { UtilsService, notificationService } from '@/services'
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

    // 删除小说相关状态
    const showDeleteModal = ref(false)
    const deletingNovel = ref(null)
    
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
    
    const promptDeleteNovel = (novel) => {
      deletingNovel.value = novel
      showDeleteModal.value = true
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
      deletingNovel.value = null
    }

    const confirmDeleteNovel = async () => {
      if (!deletingNovel.value) return
      try {
        await novelsStore.deleteNovel(deletingNovel.value.id)
      } catch (error) {
        console.error('删除小说失败:', error)
        notificationService.error('删除小说失败: ' + error.message)
      } finally {
        closeDeleteModal()
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
      // 删除相关
      showDeleteModal,
      deletingNovel,
      promptDeleteNovel,
      closeDeleteModal,
      confirmDeleteNovel,
      openNovel,
      exportNovel,
      goToSettings
    }
  }
}
</script>

<style scoped>
.homepage {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 2rem;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.settings-btn {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: var(--nav-hover-bg);
}

.new-novel-btn {
  background: var(--btn-secondary-bg);
  color: var(  --btn-secondary-color);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.new-novel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--accent-shadow);
}

.search-bar {
  margin-bottom: 32px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  background: var(--input-bg);
  color: var(--text-primary);
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-shadow);
  border-color: var(--accent-color);
}

.novels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.novel-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  transition: all 0.2s;
}

.novel-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.novel-title {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.novel-author {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.novel-description {
  margin: 0 0 16px 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.novel-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.novel-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.edit-btn {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  border: 1px solid var(--btn-secondary-color);
}

.edit-btn:hover {
  background: var(--btn-secondary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(107,114,128,0.3);
}

.delete-btn {
  background: var(--btn-danger-bg);
  color: var(--btn-danger-color);
  border: 1px solid var(--btn-danger-color);
}

.delete-btn:hover {
  background: var(--btn-danger-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(197,48,48,0.3);
}

.export-btn {
  background: var(--btn-info-bg);
  color: var(--btn-info-color);
  border: 1px solid var(--btn-info-color);
}

.export-btn:hover {
  background: var(--btn-info-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(43,108,176,0.3);
}

.open-btn {
  background: var(--btn-success-bg);
  color: var(--btn-success-color);
  border: 1px solid var(--btn-success-color);
  flex: 1;
}

.open-btn:hover {
  background: var(--btn-success-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(47,133,90,0.3);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
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

.btn-secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
}

.btn-secondary:hover {
  background: var(--nav-hover-bg);
}

.btn-danger {
  background: var(--btn-danger-bg);
  color: var(--btn-danger-color);
}

.btn-danger:hover {
  opacity: 0.9;
}
</style>
