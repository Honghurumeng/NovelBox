<template>
  <div class="settings-section">
    <h3 class="section-title">{{ $t('settings.developer.title') }}</h3>
    <div class="setting-item">
      <button @click="resetOOBE" class="reset-btn">
        {{ $t('settings.developer.resetoobe') }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeveloperSettings',
  emits: ['resetOOBE'],
  setup(props, { emit }) {
    const resetOOBE = () => {
      emit('resetOOBE')
    }
    
    return {
      resetOOBE
    }
  }
}
</script>

<style scoped>
.settings-section {
  max-width: 800px;
}

.section-title {
  margin: 0 0 24px 0;
  font-size: 1.5rem;
  color: var(--text-primary);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.setting-item {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
}

.reset-btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  background: var(--reset-btn-bg);
  color: var(--reset-btn-color);
  width: fit-content;
}

.reset-btn:hover {
  background: var(--reset-btn-hover-bg);
}
</style>