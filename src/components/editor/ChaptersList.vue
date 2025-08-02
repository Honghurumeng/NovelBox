<template>
  <div class="chapters-list-container">
    <div class="sidebar-header">
      <span v-if="!uiStore.leftSidebarCollapsed" class="sidebar-title">章节列表</span>
      <button class="toggle-sidebar-btn right-btn" @click="uiStore.toggleLeftSidebar()" title="收起侧边栏">
        <span class="toggle-icon">{{ uiStore.leftSidebarCollapsed ? '›' : '‹' }}</span>
      </button>
    </div>

    <div v-if="!uiStore.leftSidebarCollapsed" class="chapters-list-wrapper">
      <div v-for="chapter in chapters" :key="chapter.id" class="chapter-item"
        :class="{ active: currentChapter?.id === chapter.id }" @click="openChapter(chapter.id)" draggable="true"
        @dragstart="handleDragStart($event, chapter.id)" @dragover="handleDragOver"
        @drop="handleDrop($event, chapter.id)" @dragend="handleDragEnd">
        <div class="chapter-info">
          <div class="chapter-title">{{ chapter.title }}</div>
          <div class="chapter-meta">
            <span>{{ formatWordCount(chapter.wordCount) }}</span>
          </div>
        </div>
        <div class="chapter-actions" @click.stop>
          <button class="action-btn drag-handle" title="拖拽排序" draggable="true"
            @dragstart="handleDragStart($event, chapter.id)" @dragover="handleDragOver"
            @drop="handleDrop($event, chapter.id)" @dragend="handleDragEnd">
            ⠿
          </button>
          <button class="action-btn" @click="editChapterTitle(chapter.id)" title="编辑">
            ✏️
          </button>
          <button class="action-btn delete" @click="handleDeleteClick($event, chapter.id)" title="删除（ctrl+d）">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <div v-if="!uiStore.leftSidebarCollapsed" class="btn-add-chapter" @click="addNewChapter">
      + 添加新章节
    </div>

    <!-- 编辑章节标题模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑 章节列表</h3>
          <button class="close-btn" @click="closeEditModal">&times;</button>
        </div>
        <div class="modal-body">
          <input v-model="editingTitle" type="text" class="title-input" placeholder="章节标题"
            @keyup.enter="confirmEditTitle" ref="titleInput">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditModal">
            取消
          </button>
          <button class="btn btn-primary" @click="confirmEditTitle">
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>删除 章节列表</h3>
          <button class="close-btn" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除这个章节吗？此操作无法撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteModal">
            取消
          </button>
          <button class="btn btn-danger" @click="confirmDeleteChapter">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, computed } from 'vue'
import { useChaptersStore, useUIStore } from '@/stores'
import { UtilsService } from '@/services'

export default {
  name: 'ChaptersList',
  setup() {
    const chaptersStore = useChaptersStore()
    const uiStore = useUIStore()

    // 编辑章节标题相关的状态
    const showEditModal = ref(false)
    const editingChapterId = ref(null)
    const editingTitle = ref('')
    const titleInput = ref(null)

    // 删除章节相关的状态
    const showDeleteModal = ref(false)
    const deletingChapterId = ref(null)

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

      // 设置编辑状态
      editingChapterId.value = chapterId
      editingTitle.value = chapter.title
      showEditModal.value = true

      // 等待DOM更新后聚焦输入框
      await nextTick()
      titleInput.value?.focus()
      titleInput.value?.select()
    }

    const closeEditModal = () => {
      showEditModal.value = false
      editingChapterId.value = null
      editingTitle.value = ''
    }

    const confirmEditTitle = async () => {
      if (!editingChapterId.value) return

      const newTitle = editingTitle.value.trim()
      if (newTitle && newTitle !== '') {
        try {
          await chaptersStore.updateChapterTitle(editingChapterId.value, newTitle)
        } catch (error) {
          alert('更新章节标题失败: ' + error.message)
        }
      }

      closeEditModal()
    }

    const prepareDeleteChapter = (chapterId) => {
      deletingChapterId.value = chapterId
      showDeleteModal.value = true
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
      deletingChapterId.value = null
    }

    const confirmDeleteChapter = async () => {
      if (chapters.value.length <= 1) {
        alert('至少需要保留一个章节')
        return
      }

      const chapterId = deletingChapterId.value
      if (!chapterId) return

      const chapter = chapters.value.find(c => c.id === chapterId)
      if (!chapter) return

      try {
        await chaptersStore.deleteChapter(chapterId)
      } catch (error) {
        alert('删除章节失败: ' + error.message)
      } finally {
        closeDeleteModal()
      }
    }

    const deleteChapter = async (chapterId) => {
      prepareDeleteChapter(chapterId)
    }

    const handleDeleteClick = (event, chapterId) => {
      // 如果按下了Ctrl键，直接删除章节，否则显示确认对话框
      if (event.ctrlKey) {
        directDeleteChapter(chapterId)
      } else {
        prepareDeleteChapter(chapterId)
      }
    }

    const directDeleteChapter = async (chapterId) => {
      if (chapters.value.length <= 1) {
        alert('至少需要保留一个章节')
        return
      }

      try {
        await chaptersStore.deleteChapter(chapterId)
      } catch (error) {
        alert('删除章节失败: ' + error.message)
      }
    }

    const handleDragStart = (event, chapterId) => {
      chaptersStore.setDraggedChapter(chapterId)
      event.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (event) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = async (event, targetChapterId) => {
      event.preventDefault()

      const draggedChapterId = chaptersStore.draggedChapterId
      if (!draggedChapterId || draggedChapterId === targetChapterId) {
        chaptersStore.clearDraggedChapter()
        return
      }

      // Determine drop position (before or after target)
      const targetElement = event.target.closest('.chapter-item')
      if (!targetElement) {
        chaptersStore.clearDraggedChapter()
        return
      }

      const rect = targetElement.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      const position = event.clientY <= midpoint ? 'before' : 'after'

      try {
        await chaptersStore.reorderChapters(draggedChapterId, targetChapterId, position)
      } catch (error) {
        alert('重新排序章节失败: ' + error.message)
      } finally {
        chaptersStore.clearDraggedChapter()
      }
    }

    const handleDragEnd = () => {
      chaptersStore.clearDraggedChapter()
    }

    return {
      chaptersStore,
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
      handleDragEnd,

      // 编辑标题相关的返回值
      showEditModal,
      editingTitle,
      titleInput,
      closeEditModal,
      confirmEditTitle,

      // 删除章节相关的返回值
      showDeleteModal,
      prepareDeleteChapter,
      closeDeleteModal,
      confirmDeleteChapter,
      handleDeleteClick
    }
  }
}
</script>

<style scoped>
.chapters-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-title {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-primary);
  flex: 1;
}

.toggle-sidebar-btn {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.toggle-sidebar-btn:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
  transform: scale(1.05);
}

.toggle-sidebar-btn:active {
  transform: scale(0.95);
}

.toggle-icon {
  transition: transform 0.2s ease;
}

.toggle-sidebar-btn:hover .toggle-icon {
  transform: translateX(2px);
}

.toggle-sidebar-btn.right-btn {
  margin-left: auto;
}

.chapters-list-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.chapter-item {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chapter-item:hover {
  background: var(--nav-hover-bg);
}

.chapter-item.drag-over-before {
  border-top: 2px solid var(--accent-color);
}

.chapter-item.drag-over-after {
  border-bottom: 2px solid var(--accent-color);
}

.chapter-item.active {
  background: var(--nav-active-bg);
  color: var(--nav-active-color);
}

.chapter-item.dragged {
  opacity: 0.5;
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-weight: 500;
  margin: 0 0 4px 0;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-meta {
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  gap: 12px;
}

.chapter-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.chapter-item:hover .chapter-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--nav-hover-bg);
  color: var(--text-primary);
}

.drag-handle {
  cursor: move;
  color: var(--text-secondary);
  opacity: 0.5;
  transition: opacity 0.2s;
}

.chapter-item:hover .drag-handle {
  opacity: 1;
}

.btn-add-chapter {
  padding: 16px 20px;
  text-align: center;
  cursor: pointer;
  color: var(--text-primary);
  font-weight: 500;
  border-top: 1px solid var(--border-color);
  transition: all 0.2s;
}

.btn-add-chapter:hover {
  background: var(--nav-hover-bg);
}

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
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
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
}

.modal-body p {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.5;
}

.title-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 1rem;
  box-sizing: border-box;
}

.title-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
}

.btn-secondary:hover {
  background: var(--nav-hover-bg);
}

.btn-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-color);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-danger {
  background: var(--btn-danger-bg);
  color: var(--btn-danger-color);
}

.btn-danger:hover {
  opacity: 0.9;
}
</style>
