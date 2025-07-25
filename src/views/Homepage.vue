<template>
  <div class="homepage">
    <header class="header">
      <h1>{{ $t('homepage.myNovels') }}</h1>
      <div class="header-actions">
        <LanguageSwitcher />
        <button class="settings-btn" @click="goToSettings">
          {{ $t('settings.title') }}
        </button>
        <button class="new-novel-btn" @click="showNewNovelModal">
          {{ $t('homepage.createNewNovel') }}
        </button>
      </div>
    </header>
    
    <div class="search-bar">
      <input 
        type="text" 
        v-model="searchQuery" 
        :placeholder="$t('homepage.searchPlaceholder')"
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
            <span class="chapter-count">{{ novel.chapters.length }} {{ $t('chapters.chapter') }}</span>
            <span class="word-count">{{ formatTotalWordCount(novel) }} {{ $t('editor.wordCount', { count: '' }) }}</span>
          </div>
        </div>
        
        <div class="novel-actions">
          <button class="btn edit-btn" @click="editNovel(novel)">
            {{ $t('common.edit') }}
          </button>
          <button class="btn delete-btn" @click="deleteNovel(novel)">
            {{ $t('common.delete') }}
          </button>
          <button class="btn open-btn" @click="openNovel(novel)">
            {{ $t('homepage.openNovel') }}
          </button>
        </div>
      </div>
      
      <div v-if="filteredNovels.length === 0" class="no-novels">
        <p>{{ $t('homepage.noNovelsYet') }}</p>
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
import { UtilsService } from '@/services'
import NewNovelModal from '@/components/modals/NewNovelModal.vue'
import EditNovelModal from '@/components/modals/EditNovelModal.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

export default {
  name: 'Homepage',
  components: {
    NewNovelModal,
    EditNovelModal,
    LanguageSwitcher
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
        alert('创建小说失败: ' + error.message)
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
        alert('更新小说失败: ' + error.message)
      }
    }
    
    const deleteNovel = async (novel) => {
      if (confirm(`确定要删除小说 "${novel.name}" 吗？此操作无法撤销。`)) {
        try {
          await novelsStore.deleteNovel(novel.id)
        } catch (error) {
          console.error('删除小说失败:', error)
          alert('删除小说失败: ' + error.message)
        }
      }
    }
    
    const openNovel = (novel) => {
      router.push(`/editor/${novel.id}`)
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
      deleteNovel,
      openNovel,
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
  background: var(--btn-primary-bg);
  color: var(--btn-primary-color);
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
  transition: all 0.2s;
  border: 1px solid transparent;
}

.edit-btn {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
}

.edit-btn:hover {
  background: var(--nav-hover-bg);
}

.delete-btn {
  background: var(--btn-danger-bg);
  color: var(--btn-danger-color);
}

.delete-btn:hover {
  background: var(--reset-btn-hover-bg);
}

.open-btn {
  background: var(--btn-success-bg);
  color: var(--btn-success-color);
  flex: 1;
}

.open-btn:hover {
  opacity: 0.9;
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
</style>