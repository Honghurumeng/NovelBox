<template>
  <div class="modal-overlay" v-show="uiStore.showEditNovelModal" @click="closeModal">
    <div class="modal" @click.stop>
      <h3 class="modal-title">编辑小说信息</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label required" for="edit-novel-name">小说名称</label>
          <input 
            type="text" 
            id="edit-novel-name"
            v-model="formData.name"
            class="form-input" 
            placeholder="请输入小说名称" 
            required
            maxlength="100"
            ref="nameInput"
          >
        </div>
        
        <div class="form-group">
          <label class="form-label required" for="edit-novel-author">作者</label>
          <input 
            type="text" 
            id="edit-novel-author"
            v-model="formData.author"
            class="form-input" 
            placeholder="请输入作者姓名" 
            required
            maxlength="50"
          >
        </div>
        
        <div class="form-group">
          <label class="form-label" for="edit-novel-description">简介</label>
          <textarea 
            id="edit-novel-description"
            v-model="formData.description"
            class="form-textarea" 
            placeholder="请输入小说简介（可选）"
            maxlength="500"
          ></textarea>
        </div>
        
        <div class="modal-buttons">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            取消
          </button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import { useNovelsStore, useUIStore } from '@/stores'
import { UtilsService } from '@/services'

export default {
  name: 'EditNovelModal',
  setup() {
    const novelsStore = useNovelsStore()
    const uiStore = useUIStore()
    
    const nameInput = ref(null)
    const submitting = ref(false)
    const editingNovelId = ref(null)
    
    const formData = ref({
      name: '',
      author: '',
      description: ''
    })

    // 重置表单
    const resetForm = () => {
      formData.value = {
        name: '',
        author: '',
        description: ''
      }
      editingNovelId.value = null
    }

    // 填充表单数据
    const fillForm = (novel) => {
      if (novel) {
        formData.value = {
          name: novel.name,
          author: novel.author,
          description: novel.description || ''
        }
        editingNovelId.value = novel.id
      }
    }

    // 关闭模态框
    const closeModal = () => {
      uiStore.closeEditNovelModal()
      resetForm()
    }

    // 处理表单提交
    const handleSubmit = async () => {
      if (!editingNovelId.value) return

      const validation = UtilsService.validateNovelData(formData.value)
      
      if (!validation.isValid) {
        alert(validation.errors.join('\n'))
        return
      }

      submitting.value = true
      
      try {
        await novelsStore.updateNovel(editingNovelId.value, formData.value)
        closeModal()
      } catch (error) {
        alert('保存失败: ' + error.message)
      } finally {
        submitting.value = false
      }
    }

    // 监听模态框显示状态
    watch(() => uiStore.showEditNovelModal, (show) => {
      if (show && uiStore.editNovelData) {
        fillForm(uiStore.editNovelData)
        nextTick(() => {
          nameInput.value?.focus()
        })
      }
    })

    return {
      uiStore,
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
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-title {
  font-size: 1.5em;
  font-weight: 600;
  color: #333;
  margin-bottom: 25px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
}

.form-label.required::after {
  content: ' *';
  color: #ff4757;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1em;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 30px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f3f4;
  color: #5f6368;
}

.btn-secondary:hover:not(:disabled) {
  background: #e8eaed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}
</style>