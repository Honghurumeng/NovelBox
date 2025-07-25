<template>
  <div class="ai-panel" :class="{ collapsed: uiStore.rightSidebarCollapsed }">
    <div class="sidebar-header">
      <span class="sidebar-title">AI工具</span>
      <button 
        class="btn-collapse" 
        @click="uiStore.toggleRightSidebar()" 
        title="收起侧边栏"
      >
        ›
      </button>
    </div>
    
    <div class="ai-tools-content">
      <div class="ai-tools-placeholder">
        <div class="ai-icon">🤖</div>
        <h3>AI创作助手</h3>
        <p class="ai-description">智能写作功能即将推出</p>
        
        <div class="coming-features">
          <div class="feature-item">
            <span class="feature-icon">✨</span>
            <span class="feature-text">智能续写</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🎯</span>
            <span class="feature-text">情节建议</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📝</span>
            <span class="feature-text">文本优化</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔍</span>
            <span class="feature-text">内容分析</span>
          </div>
        </div>
        
        <div class="ai-status">
          <div class="status-indicator"></div>
          <span class="status-text">开发中...</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 收起状态的切换按钮 -->
  <div 
    v-show="uiStore.rightSidebarCollapsed"
    class="sidebar-toggle right-toggle" 
    @click="uiStore.toggleRightSidebar()" 
    title="展开AI工具"
  >
    ‹
  </div>
</template>

<script>
import { useUIStore } from '@/stores'

export default {
  name: 'AIPanel',
  setup() {
    const uiStore = useUIStore()

    return {
      uiStore
    }
  }
}
</script>

<style scoped>
.ai-panel {
  width: 320px;
  background: white;
  border-left: 1px solid #e1e8ed;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden;
}

.ai-panel.collapsed {
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

.ai-tools-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.ai-tools-placeholder {
  padding: 40px 30px;
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ai-icon {
  font-size: 4em;
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.ai-tools-placeholder h3 {
  color: #333;
  margin-bottom: 12px;
  font-size: 1.3em;
  font-weight: 600;
}

.ai-description {
  color: #666;
  margin-bottom: 30px;
  font-size: 0.95em;
  line-height: 1.5;
}

.coming-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
  width: 100%;
  max-width: 220px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.feature-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.feature-icon {
  font-size: 1.2em;
  width: 20px;
  text-align: center;
}

.feature-text {
  font-size: 0.9em;
  color: #555;
  font-weight: 500;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #667eea;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.status-text {
  font-size: 0.85em;
  color: #667eea;
  font-weight: 500;
}

.sidebar-toggle {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 60px;
  background: white;
  border: 1px solid #e1e8ed;
  border-right: none;
  border-radius: 12px 0 0 12px;
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
</style>