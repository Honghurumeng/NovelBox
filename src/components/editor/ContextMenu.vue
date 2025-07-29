<template>
  <div 
    v-if="visible" 
    ref="contextMenu"
    class="context-menu"
    :style="menuStyle"
    @click.stop
  >
    <!-- AI重写功能 - 直接放在一级菜单 -->
    <div class="context-menu-item" @click="handleRewrite('expand')">
      <span class="menu-icon">📈</span>
      扩写
    </div>
    <div class="context-menu-item" @click="handleRewrite('contract')">
      <span class="menu-icon">📉</span>
      缩写
    </div>
    <div class="context-menu-item" @click="handleRewrite('beautify')">
      <span class="menu-icon">✨</span>
      美化文笔
    </div>
    <div class="context-menu-item" @click="handleRewrite('continue')">
      <span class="menu-icon">✍️</span>
      续写
    </div>
    <div class="menu-divider"></div>
    <div class="context-menu-item" @click="handleRewrite('custom')">
      <span class="menu-icon">⚙️</span>
      自定义
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ContextMenu',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    selectedText: {
      type: String,
      default: ''
    },
    textareaRef: {
      type: Object,
      default: null
    }
  },
  emits: ['rewrite', 'hide'],
  setup(props, { emit }) {
    const contextMenu = ref(null)

    const menuStyle = computed(() => ({
      position: 'fixed',
      left: `${props.position.x}px`,
      top: `${props.position.y}px`,
      zIndex: 2000
    }))

    const handleRewrite = (type) => {
      emit('rewrite', type)
      emit('hide')
    }

    return {
      contextMenu,
      menuStyle,
      handleRewrite
    }
  }
}
</script>

<style scoped>
.context-menu {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  padding: 4px 0;
  min-width: 200px;
  backdrop-filter: blur(8px);
  user-select: none;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 13px;
  transition: all 0.2s;
  position: relative;
}

.context-menu-item:hover {
  background: var(--nav-hover-bg);
  color: var(--accent-color);
}

.menu-icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

</style>
