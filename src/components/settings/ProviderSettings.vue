.fetch-models-btn {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.fetch-models-btn:hover {
  opacity: 0.9;
}

.fetch-models-btn:active {
  transform: translateY(1px);
}

.models-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.models-actions {
  flex-shrink: 0;
}
<template>
  <div class="provider-settings">
    <h3 class="section-title">提供商设置</h3>
    <div class="provider-container">
      <div class="provider-list">
        <div class="list-header">
          <h4>提供商列表</h4>
          <button class="add-provider-btn" @click="showAddProviderModal" title="添加提供商">
            +
          </button>
        </div>
        <div class="list-content">
          <div
            v-for="provider in providers"
            :key="provider.id"
            class="provider-item"
            :class="{ active: selectedProvider?.id === provider.id }"
            @click="selectProvider(provider)"
          >
            <div class="provider-icon">
              {{ getProviderIcon(provider.type) }}
            </div>
            <div class="provider-info">
              <div class="provider-name">{{ provider.name || '未命名提供商' }}</div>
              <div class="provider-type">{{ provider.type }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="provider-details">
        <div v-if="selectedProvider" class="details-content">
          <div class="details-header">
            <h4>{{ selectedProvider.name || '未命名提供商' }}</h4>
            <button class="delete-btn" @click="deleteProvider(selectedProvider.id)">
              删除
            </button>
          </div>

          <div class="details-form-body">
            <div class="form-group">
              <label>提供商名称</label>
              <input
                v-model="selectedProvider.name"
                type="text"
                class="form-input"
                placeholder="输入提供商名称"
              >
            </div>

            <div class="form-group">
              <label>提供商类型</label>
              <select v-model="selectedProvider.type" class="form-select" disabled>
                <option value="OpenAI">OpenAI</option>
                <option value="Gemini">Gemini</option>
              </select>
            </div>

            <div class="form-group">
              <label>API基础URL</label>
              <input
                v-model="selectedProvider.base_url"
                type="text"
                class="form-input"
                placeholder="例如: https://api.openai.com/v1"
              >
            </div>

            <div class="form-group">
              <label>API密钥</label>
              <input
                v-model="selectedProvider.api_key"
                type="password"
                class="form-input"
                placeholder="输入您的API密钥"
                @blur="fetchModels"
              >
            </div>

            <div class="form-group models-section">
              <div class="models-header">
                <label>模型列表</label>
                <div class="models-actions">
                  <button class="fetch-models-btn" @click="fetchModels">
                    获取模型列表
                  </button>
                </div>
              </div>
              <div class="models-list-container">
                <div class="models-list">
                  <div
                    v-for="(model, index) in selectedProvider.models"
                    :key="index"
                    class="model-item"
                  >
                    <input
                      v-model="model.id"
                      v-if="selectedProvider.type === 'OpenAI'"
                      type="text"
                      class="model-input"
                      placeholder="模型名称"
                    >
                    <input
                      v-model="model.name"
                      v-else
                      type="text"
                      class="model-input"
                      placeholder="模型名称"
                    >
                    <button
                      class="remove-model-btn"
                      @click="removeModel(index)"
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                  <div class="add-model-row">
                    <input
                      v-model="newModelName"
                      type="text"
                      class="model-input"
                      placeholder="输入模型名称并按回车添加"
                      @keyup.enter="addModel"
                    >
                    <button
                      class="add-model-btn"
                      @click="addModel"
                      :disabled="!newModelName.trim()"
                    >
                      +
                    </button>
                  </div>
                  <div v-if="selectedProvider.models.length === 0 && !newModelName" class="no-models">
                    暂无模型，请添加或获取模型列表
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button class="save-btn" @click="saveProvider">
              保存
            </button>
          </div>
        </div>

        <div v-else class="no-selection">
          <p>请选择一个提供商进行配置</p>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加提供商</h3>
          <button class="close-btn" @click="closeAddModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>提供商类型</label>
            <select v-model="newProvider.type" class="form-select">
              <option value="OpenAI">OpenAI</option>
              <option value="Gemini">Gemini</option>
            </select>
          </div>
          <div class="form-group">
            <label>提供商名称</label>
            <input
              v-model="newProvider.name"
              type="text"
              class="form-input"
              placeholder="输入提供商名称"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeAddModal">
            取消
          </button>
          <button class="confirm-btn" @click="addProvider">
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 提供商数据
const providers = ref([])
const selectedProvider = ref(null)
const showAddModal = ref(false)
const newModelName = ref('')

// 新提供商表单
const newProvider = ref({
  type: 'OpenAI',
  name: ''
})

// 获取提供商图标
const getProviderIcon = (type) => {
  switch (type) {
    case 'OpenAI':
      return '🤖'
    case 'Gemini':
      return '✨'
    default:
      return '🔌'
  }
}

// 显示添加提供商模态框
const showAddProviderModal = () => {
  newProvider.value = {
    type: 'OpenAI',
    name: ''
  }
  showAddModal.value = true
}

// 关闭添加提供商模态框
const closeAddModal = () => {
  showAddModal.value = false
}

// 添加提供商
const addProvider = () => {
  if (!newProvider.value.name.trim()) {
    alert('请输入提供商名称')
    return
  }
  
  const provider = {
    id: Date.now().toString(),
    type: newProvider.value.type,
    name: newProvider.value.name,
    base_url: '',
    api_key: '',
    models: []
  }
  
  providers.value.push(provider)
  closeAddModal()
  saveProviders()
}

// 选择提供商
const selectProvider = (provider) => {
  selectedProvider.value = provider
}

// 删除提供商
const deleteProvider = (id) => {
  if (!confirm('确定要删除这个提供商吗？')) return
  
  const index = providers.value.findIndex(p => p.id === id)
  if (index !== -1) {
    providers.value.splice(index, 1)
    
    if (selectedProvider.value && selectedProvider.value.id === id) {
      selectedProvider.value = providers.value.length > 0 ? providers.value[0] : null
    }
    
    saveProviders()
  }
}

// 保存提供商
const saveProvider = () => {
  saveProviders()
  alert('提供商配置已保存')
}

// 从上游获取模型列表
const fetchModels = async () => {
  if (!selectedProvider.value || !selectedProvider.value.api_key) {
    alert('请输入API密钥');
    return;
  }
  
  try {
    // 显示加载状态
    const originalModels = [...selectedProvider.value.models];
    selectedProvider.value.models = [];
    
    // 构建请求URL和headers
    let url, headers;
    if (selectedProvider.value.type === 'OpenAI') {
      url = selectedProvider.value.base_url || 'https://api.openai.com/v1';
      url += '/models';
      headers = {
        'Authorization': `Bearer ${selectedProvider.value.api_key}`,
        'Content-Type': 'application/json'
      };
    } else if (selectedProvider.value.type === 'Gemini') {
      url = selectedProvider.value.base_url || 'https://generativelanguage.googleapis.com/v1beta';
      url += `/models?key=${selectedProvider.value.api_key}`;
      headers = {
        'Content-Type': 'application/json'
      };
    } else {
      throw new Error('Unsupported provider type');
    }
    
    // 发起请求
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    
    if (selectedProvider.value.type === 'OpenAI') {
      selectedProvider.value.models = result.data.map(model => ({
        id: model.id,
        owned_by: model.owned_by,
        created: model.created
      }));
    } else if (selectedProvider.value.type === 'Gemini') {
      selectedProvider.value.models = result.models.map(model => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description
      }));
    }
    
    saveProviders();
  } catch (error) {
    console.error('获取模型列表失败:', error);
    alert('获取模型列表失败' + ': ' + error.message);
    // 恢复原始模型列表
    if (selectedProvider.value) {
      selectedProvider.value.models = originalModels;
    }
  }
}

// 添加模型
const addModel = () => {
  if (!selectedProvider.value || !newModelName.value.trim()) return
  
  const newModel = selectedProvider.value.type === 'OpenAI' 
    ? { id: newModelName.value.trim() }
    : { name: newModelName.value.trim() }
  
  selectedProvider.value.models.push(newModel)
  newModelName.value = ''
}

// 移除模型
const removeModel = (index) => {
  if (!selectedProvider.value) return
  selectedProvider.value.models.splice(index, 1)
}

// 保存提供商到本地存储
const saveProviders = () => {
  localStorage.setItem('novelbox-providers', JSON.stringify(providers.value))
}

// 从本地存储加载提供商
const loadProviders = () => {
  try {
    const saved = localStorage.getItem('novelbox-providers')
    if (saved) {
      providers.value = JSON.parse(saved)
      if (providers.value.length > 0) {
        selectedProvider.value = providers.value[0]
      }
    }
  } catch (error) {
    console.error('加载提供商失败:', error)
    providers.value = []
  }
}

// 初始化
onMounted(() => {
  loadProviders()
})
</script>

<style scoped>
.provider-settings {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  margin: 0 0 24px 0;
  font-size: 1.5rem;
  color: var(--text-primary);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.provider-container {
  display: flex;
  gap: 24px;
  height: calc(100vh - 200px);
}

.provider-list {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.list-header h4 {
  margin: 0;
  color: var(--text-primary);
}

.add-provider-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-color);
  color: white;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-provider-btn:hover {
  opacity: 0.9;
}

.list-content {
  flex: 1;
  overflow-y: auto;
}

.provider-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
}

.provider-item:hover {
  background: var(--nav-hover-bg);
}

.provider-item.active {
  background: var(--nav-active-bg);
}

.provider-icon {
  font-size: 1.2rem;
  margin-right: 12px;
}

.provider-info {
  flex: 1;
}

.provider-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.provider-type {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.provider-details {
  flex: 2;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  display: flex; /* Added to make the content fill the height */
  flex-direction: column; /* Added */
}

.details-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box; /* Ensures padding is included in height calculation */
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0; /* Changed from 24px */
  padding-bottom: 24px; /* Added */
  flex-shrink: 0; /* Prevent header from shrinking */
}

.details-header h4 {
  margin: 0;
  color: var(--text-primary);
}

/* New style for the scrollable form body */
.details-form-body {
  flex: 1; /* Allows this element to grow and fill available space */
  overflow-y: auto; /* Adds a scrollbar when content overflows */
  margin-bottom: 20px;
}


.delete-btn {
  background: var(--danger-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.delete-btn:hover {
  opacity: 0.9;
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
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 1rem;
  box-sizing: border-box; /* Added for consistency */
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.models-list {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  /* max-height is removed, scrolling is handled by .details-form-body */
  overflow-y: visible; /* Changed from auto */
  background: var(--content-bg);
}

.model-item,
.add-model-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
}

.model-item:last-child,
.add-model-row:last-child {
  border-bottom: none;
}

.model-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.9rem;
  margin-right: 8px;
}

.model-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.remove-model-btn,
.add-model-btn {
  background: none;
  border: none;
  color: var(--danger-color);
  font-size: 1.2rem;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.remove-model-btn:hover {
  background: var(--danger-hover-bg);
}

.add-model-btn {
  background: var(--accent-color);
  color: white;
}

.add-model-btn:hover {
  opacity: 0.9;
}

.add-model-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-models {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
}

.form-actions {
  /* padding-top: 20px; Removed */
  flex-shrink: 0; /* Prevent footer from shrinking */
}

.save-btn {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.save-btn:hover {
  opacity: 0.9;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: var(--nav-hover-bg);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  border: none;
}

.cancel-btn {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
}

.cancel-btn:hover {
  background: var(--btn-secondary-hover);
}

.confirm-btn {
  background: var(--accent-color);
  color: white;
}

.confirm-btn:hover {
  opacity: 0.9;
}
</style>