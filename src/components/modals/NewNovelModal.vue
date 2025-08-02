<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">创建新小说</h2>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="novelName" class="form-label">小说名称</label>
            <input
              id="novelName"
              v-model.trim="formData.name"
              type="text"
              placeholder="请输入小说名称"
              class="form-input"
              required
              maxlength="100"
              ref="nameInput"
            />
          </div>
          
          <div class="form-group">
            <label for="novelAuthor" class="form-label">作者</label>
            <input
              id="novelAuthor"
              v-model.trim="formData.author"
              type="text"
              placeholder="请输入作者名"
              class="form-input"
              required
              maxlength="50"
            />
          </div>
            
          <div class="form-group">
            <label for="novelDescription" class="form-label">简介</label>
            <textarea
              id="novelDescription"
              v-model.trim="formData.description"
              placeholder="请输入小说简介"
              class="form-textarea"
              rows="4"
              maxlength="500"
            ></textarea>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-cancel" @click="closeModal">
              取消
            </button>
            <button type="submit" class="btn btn-primary btn-create" :disabled="submitting">
              {{ submitting ? "保存中..." : "保存" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, nextTick } from 'vue'
import { useNovelsStore, useUIStore } from '@/stores'
import { UtilsService, notificationService } from '@/services'

export default {
  name: 'NewNovelModal',
  setup() {
    const novelsStore = useNovelsStore()
    const uiStore = useUIStore()
    
    const nameInput = ref(null)
    const submitting = ref(false)
    
    const formData = reactive({
      name: '',
      author: '',
      description: ''
    })

    // 重置表单
    const resetForm = () => {
      formData.name = ''
      formData.author = ''
      formData.description = ''
    }

    // 关闭模态框
    const closeModal = () => {
      uiStore.closeNewNovelModal()
      resetForm()
    }

    // 处理表单提交
    const handleSubmit = async () => {
      const validation = UtilsService.validateNovelData(formData)
      
      if (!validation.isValid) {
        notificationService.warning(validation.errors.join('\n'))
        return
      }

      submitting.value = true
      
      try {
        await novelsStore.createNovel(formData)
        closeModal()
      } catch (error) {
        notificationService.error('创建失败: ' + error.message)
      } finally {
        submitting.value = false
      }
    }

    // 监听模态框显示状态，自动聚焦
    watch(() => uiStore.showNewNovelModal, (show) => {
      if (show) {
        nextTick(() => {
          nameInput.value?.focus()
        })
      }
    })

    return {
      formData,
      nameInput,
      submitting,
      closeModal,
      handleSubmit
    }
  }
}
</script>

<style scoped>
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
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary);
  font-weight: 600;
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
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-secondary);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
}

.btn-cancel:hover {
  background: var(--nav-hover-bg);
}

.btn-create {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
}

.btn-create:hover {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
