<template>
  <div class="homepage">
    <h1 class="welcome-title">NovelBox</h1>
    
    <!-- 存储设置 -->
    <div class="storage-settings">
      <div class="storage-info">
        <span class="storage-label">存储目录:</span>
        <span class="storage-path">{{ uiStore.storagePath }}</span>
      </div>
      <div class="storage-actions">
        <button class="btn-storage" @click="selectStorageDirectory" title="选择存储目录">
          更改目录
        </button>
        <button class="btn-storage" @click="resetStorageDirectory" title="重置为默认目录">
          重置默认
        </button>
      </div>
    </div>
    
    <div class="main-content">
      <div class="novels-header">
        <h2 class="novels-title">我的小说</h2>
        <button class="btn-new-novel" @click="uiStore.openNewNovelModal()">
          新建小说
        </button>
      </div>
      
      <div class="novels-list">
        <!-- 空状态 -->
        <div v-if="!novelsStore.hasNovels && !novelsStore.loading" class="empty-state">
          <div class="empty-state-icon">📚</div>
          <p>还没有小说，点击上方按钮创建第一部作品吧！</p>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="novelsStore.loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        
        <!-- 小说列表 -->
        <div v-for="novel in novelsStore.novels" :key="novel.id" class="novel-card">
          <div class="novel-cover" @click="openNovel(novel.id)">
            <img v-if="novel.cover" :src="novel.cover" alt="封面" />
            <span v-else>暂无封面</span>
          </div>
          <div class="novel-info" @click="openNovel(novel.id)">
            <div class="novel-title">{{ novel.name }}</div>
            <div class="novel-author">作者：{{ novel.author }}</div>
            <div class="novel-description">
              {{ novel.description || '暂无简介' }}
            </div>
          </div>
          <div class="novel-actions" @click.stop>
            <button 
              class="novel-action-btn" 
              @click="editNovelInfo(novel.id)" 
              title="编辑信息"
            >
              ✏️
            </button>
            <button 
              class="novel-action-btn delete" 
              @click="deleteNovel(novel.id)" 
              title="删除小说"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 模态框组件 -->
    <NewNovelModal />
    <EditNovelModal />
  </div>
</template>

<script>
import { useNovelsStore, useUIStore } from '@/stores'
import { useRouter } from 'vue-router'
import NewNovelModal from '@/components/modals/NewNovelModal.vue'
import EditNovelModal from '@/components/modals/EditNovelModal.vue'

export default {
  name: 'Homepage',
  components: {
    NewNovelModal,
    EditNovelModal
  },
  setup() {
    const novelsStore = useNovelsStore()
    const uiStore = useUIStore()
    const router = useRouter()

    // 初始化数据
    const init = async () => {
      await novelsStore.loadNovels()
      await uiStore.updateStoragePath()
    }

    // 页面生命周期
    const onMounted = () => {
      init()
    }

    // 打开小说
    const openNovel = (novelId) => {
      novelsStore.setCurrentNovel(novelId)
      router.push(`/editor/${novelId}`)
    }

    // 编辑小说信息
    const editNovelInfo = (novelId) => {
      const novel = novelsStore.novels.find(n => n.id === novelId)
      if (novel) {
        // Set edit modal data
        uiStore.editNovelData = { ...novel }
        uiStore.openEditNovelModal()
      }
    }

    // 删除小说
    const deleteNovel = async (novelId) => {
      if (confirm('确定要删除这部小说吗？此操作不可撤销。')) {
        try {
          await novelsStore.deleteNovel(novelId)
        } catch (error) {
          alert('删除失败: ' + error.message)
        }
      }
    }

    // 存储目录操作
    const selectStorageDirectory = async () => {
      try {
        const selectedPath = await uiStore.selectStorageDirectory()
        if (selectedPath) {
          alert('存储目录已更改为: ' + selectedPath)
        }
      } catch (error) {
        alert('选择目录失败: ' + error.message)
      }
    }

    const resetStorageDirectory = async () => {
      try {
        const defaultPath = await uiStore.resetStorageDirectory()
        alert('已重置为默认存储目录: ' + defaultPath)
      } catch (error) {
        alert('重置失败: ' + error.message)
      }
    }

    return {
      novelsStore,
      uiStore,
      onMounted,
      openNovel,
      editNovelInfo,
      deleteNovel,
      selectStorageDirectory,
      resetStorageDirectory
    }
  },
  async mounted() {
    this.onMounted()
  }
}
</script>

<style scoped>
.homepage {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.welcome-title {
  font-size: 3.5em;
  font-weight: 700;
  text-align: center;
  margin: 60px 0 20px 0;
  background: linear-gradient(45deg, #fff, #f0f8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 存储设置样式 */
.storage-settings {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  margin: 0 0 40px 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.storage-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.storage-label {
  font-weight: 500;
  color: #555;
}

.storage-path {
  font-family: 'Courier New', monospace;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  color: #333;
}

.storage-actions {
  display: flex;
  gap: 10px;
}

.btn-storage {
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;
}

.btn-storage:hover {
  background: #5a6fd8;
}

.main-content {
  width: 100%;
  max-width: 1200px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.novels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.novels-title {
  font-size: 1.8em;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.btn-new-novel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-new-novel:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

/* 小说列表样式 */
.novels-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state-icon {
  font-size: 4em;
  margin-bottom: 20px;
}

.loading-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.novel-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
}

.novel-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.novel-cover {
  width: 100%;
  height: 120px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  color: #666;
  font-size: 0.9em;
}

.novel-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.novel-info {
  flex: 1;
}

.novel-title {
  font-size: 1.2em;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.novel-author {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 8px;
}

.novel-description {
  font-size: 0.9em;
  color: #777;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.novel-actions {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.novel-card:hover .novel-actions {
  opacity: 1;
}

.novel-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.novel-action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.novel-action-btn.delete:hover {
  background: #ff4757;
  color: white;
}
</style>