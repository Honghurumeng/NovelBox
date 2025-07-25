<template>
  <div class="ai-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <span class="ai-icon">🤖</span>
        {{ $t('editor.aiPanel.title') }}
      </h2>
      <p class="panel-description">
        {{ $t('editor.aiPanel.placeholderDescription') }}
      </p>
      <span class="status-badge">{{ $t('editor.aiPanel.status') }}</span>
    </div>
    
    <div class="panel-content">
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">✏️</div>
          <h3 class="feature-title">{{ $t('editor.aiPanel.features.continueWriting') }}</h3>
          <p class="feature-description">{{ $t('editor.aiPanel.featureDescriptions.continueWriting') }}</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📈</div>
          <h3 class="feature-title">{{ $t('editor.aiPanel.features.plotSuggestions') }}</h3>
          <p class="feature-description">{{ $t('editor.aiPanel.featureDescriptions.plotSuggestions') }}</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">✨</div>
          <h3 class="feature-title">{{ $t('editor.aiPanel.features.textOptimization') }}</h3>
          <p class="feature-description">{{ $t('editor.aiPanel.featureDescriptions.textOptimization') }}</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔍</div>
          <h3 class="feature-title">{{ $t('editor.aiPanel.features.contentAnalysis') }}</h3>
          <p class="feature-description">{{ $t('editor.aiPanel.featureDescriptions.contentAnalysis') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useUIStore } from '@/stores'
import { useI18n } from 'vue-i18n'

export default {
  name: 'AIPanel',
  setup() {
    const { t } = useI18n()
    const uiStore = useUIStore()

    return {
      uiStore,
      t
    }
  }
}
</script>

<style scoped>
.ai-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  margin: 0 0 16px 0;
  font-size: 1.2rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-icon {
  font-size: 1.5rem;
}

.panel-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  margin-top: 8px;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.feature-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow);
}

.feature-icon {
  font-size: 1.5rem;
  margin-bottom: 12px;
}

.feature-title {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.feature-description {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.placeholder-section {
  text-align: center;
  padding: 40px 20px;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  color: var(--text-secondary);
}

.placeholder-title {
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.placeholder-description {
  margin: 0 0 20px 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}
</style>