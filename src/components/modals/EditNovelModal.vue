<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ $t('modals.editNovel.title') }}</h2>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      
      <form @submit.prevent="updateNovel" class="modal-form">
        <div class="form-group">
          <label for="novelName">{{ $t('modals.editNovel.nameLabel') }}</label>
          <input
            id="novelName"
            v-model="formData.name"
            type="text"
            :placeholder="$t('modals.editNovel.namePlaceholder')"
            class="form-input"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="novelAuthor">{{ $t('modals.editNovel.authorLabel') }}</label>
          <input
            id="novelAuthor"
            v-model="formData.author"
            type="text"
            :placeholder="$t('modals.editNovel.authorPlaceholder')"
            class="form-input"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="novelDescription">{{ $t('modals.editNovel.descriptionLabel') }}</label>
          <textarea
            id="novelDescription"
            v-model="formData.description"
            :placeholder="$t('modals.editNovel.descriptionPlaceholder')"
            class="form-textarea"
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            {{ $t('common.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary">
            {{ $t('common.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'EditNovelModal',
  props: {
    novel: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'update'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    const formData = reactive({
      name: '',
      author: '',
      description: ''
    })

    // 初始化表单数据
    watch(() => props.novel, (newNovel) => {
      if (newNovel) {
        formData.name = newNovel.name || ''
        formData.author = newNovel.author || ''
        formData.description = newNovel.description || ''
      }
    }, { immediate: true })

    const closeModal = () => {
      emit('close')
    }

    const updateNovel = () => {
      emit('update', props.novel.id, { ...formData })
    }

    return {
      formData,
      closeModal,
      updateNovel
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

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
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

.modal-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
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

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
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
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--accent-shadow);
}
</style>