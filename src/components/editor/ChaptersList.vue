<template>
  <div class="chapters-sidebar" :class="{ collapsed: uiStore.leftSidebarCollapsed }">
    <div class="sidebar-header">
      <span class="sidebar-title">章节列表</span>
      <button 
        class="btn-collapse" 
        @click="uiStore.toggleLeftSidebar()" 
        title="收起侧边栏"
      >
        ‹
      </button>
    </div>
    
    <div class="chapters-list">
      <div 
        v-for="chapter in chapters" 
        :key="chapter.id"
        class="chapter-item"
        :class="{ active: currentChapter?.id === chapter.id }"
        @click="openChapter(chapter.id)"
        draggable="true"
        @dragstart="handleDragStart($event, chapter.id)"
        @dragover="handleDragOver"
        @drop="handleDrop($event, chapter.id)"
        @dragend="handleDragEnd"
      >
        <div class="chapter-content">
          <div class="chapter-title">{{ chapter.title }}</div>
          <div class="chapter-word-count">{{ formatWordCount(chapter.wordCount) }}</div>
        </div>
        <div class="chapter-actions" @click.stop>
          <button 
            class="chapter-action-btn" 
            @click="editChapterTitle(chapter.id)" 
            title="重命名"
          >
            ✏️
          </button>
          <button 
            class="chapter-action-btn delete" 
            @click="deleteChapter(chapter.id)" 
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
    
    <div class="btn-add-chapter" @click="addNewChapter">
      + 添加新章节
    </div>
  </div>
  
  <!-- 收起状态的切换按钮 -->
  <div 
    v-show="uiStore.leftSidebarCollapsed"
    class="sidebar-toggle left-toggle" 
    @click="uiStore.toggleLeftSidebar()" 
    title="展开章节列表"
  >
    ›
  </div>
</template>

<script>
import { computed } from 'vue'
import { useChaptersStore, useUIStore } from '@/stores'
import { UtilsService } from '@/services'

export default {
  name: 'ChaptersList',
  setup() {
    const chaptersStore = useChaptersStore()
    const uiStore = useUIStore()

    const chapters = computed(() => chaptersStore.chapters)
    const currentChapter = computed(() => chaptersStore.currentChapter)

    const formatWordCount = (count) => {
      return UtilsService.formatWordCount(count)
    }

    const openChapter = async (chapterId) => {
      await chaptersStore.openChapter(chapterId)
    }

    const addNewChapter = async () => {
      try {
        const newChapter = await chaptersStore.addNewChapter()
        if (newChapter) {
          await chaptersStore.openChapter(newChapter.id)
        }
      } catch (error) {
        alert('添加章节失败: ' + error.message)
      }
    }

    const editChapterTitle = async (chapterId) => {
      const chapter = chapters.value.find(c => c.id === chapterId)
      if (!chapter) return

      const newTitle = prompt('请输入新的章节标题:', chapter.title)
      if (newTitle && newTitle.trim() && newTitle.trim() !== chapter.title) {
        try {
          await chaptersStore.updateChapterTitle(chapterId, newTitle.trim())
        } catch (error) {
          alert('重命名失败: ' + error.message)
        }
      }
    }

    const deleteChapter = async (chapterId) => {
      if (!confirm('确定要删除这个章节吗？此操作不可撤销。')) {
        return
      }

      try {
        await chaptersStore.deleteChapter(chapterId)
      } catch (error) {
        alert(error.message)
      }
    }

    // Drag and drop handlers
    const handleDragStart = (e, chapterId) => {
      chaptersStore.setDraggedChapter(chapterId)
      e.dataTransfer.effectAllowed = 'move'
      e.currentTarget.classList.add('dragging')
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const target = e.currentTarget
      if (target && target.classList.contains('chapter-item')) {
        const rect = target.getBoundingClientRect()
        const midway = rect.top + (rect.height / 2)
        if (e.clientY < midway) {
          target.classList.add('drag-over-top')
          target.classList.remove('drag-over-bottom')
        } else {
          target.classList.add('drag-over-bottom')
          target.classList.remove('drag-over-top')
        }
      }
    }

    const handleDrop = async (e, targetChapterId) => {
      e.preventDefault()
      const draggedChapterId = chaptersStore.draggedChapterId
      
      if (draggedChapterId === targetChapterId) return

      const target = e.currentTarget
      const rect = target.getBoundingClientRect()
      const midway = rect.top + (rect.height / 2)
      const position = e.clientY < midway ? 'before' : 'after'

      try {
        await chaptersStore.reorderChapters(draggedChapterId, targetChapterId, position)
      } catch (error) {
        alert('重排序失败: ' + error.message)
      }
    }

    const handleDragEnd = (e) => {
      chaptersStore.clearDraggedChapter()
      const items = document.querySelectorAll('.chapter-item')
      items.forEach(item => {
        item.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom')
      })
    }

    return {
      uiStore,
      chapters,
      currentChapter,
      formatWordCount,
      openChapter,
      addNewChapter,
      editChapterTitle,
      deleteChapter,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd
    }
  }
}
</script>

<style scoped>
.chapters-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e1e8ed;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden;
}

.chapters-sidebar.collapsed {
  width: 0;
  min-width: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.sidebar-title {
  font-weight: 600;
  color: #333;
  font-size: 1.1em;
}

.btn-collapse {
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  color: #666;
  transition: all 0.2s;
}

.btn-collapse:hover {
  background: #e9ecef;
  color: #333;
}

.chapters-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.chapter-item {
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f4;
  transition: all 0.2s;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chapter-item:hover {
  background: #f8f9fa;
}

.chapter-item.active {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.chapter-item.dragging {
  opacity: 0.5;
}

.chapter-item.drag-over-top::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #2196f3;
}

.chapter-item.drag-over-bottom::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #2196f3;
}

.chapter-content {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-word-count {
  font-size: 0.85em;
  color: #666;
}

.chapter-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.chapter-item:hover .chapter-actions {
  opacity: 1;
}

.chapter-action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
}

.chapter-action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.chapter-action-btn.delete:hover {
  background: #ff4757;
  color: white;
}

.btn-add-chapter {
  padding: 15px 20px;
  text-align: center;
  cursor: pointer;
  color: #667eea;
  font-weight: 500;
  border-top: 1px solid #e1e8ed;
  background: #f8f9fa;
  transition: all 0.2s;
}

.btn-add-chapter:hover {
  background: #e9ecef;
  color: #5a67d8;
}

.sidebar-toggle {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 60px;
  background: white;
  border: 1px solid #e1e8ed;
  border-left: none;
  border-radius: 0 12px 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2em;
  color: #666;
  transition: all 0.2s;
  z-index: 100;
}

.sidebar-toggle:hover {
  background: #f8f9fa;
  color: #333;
}

.sidebar-toggle.left-toggle {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 30px;
  height: 60px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 100;
  transition: all 0.3s ease;
}

.sidebar-toggle.left-toggle:hover {
  background: #5a6fd8;
  width: 35px;
}
</style>
