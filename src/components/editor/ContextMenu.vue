<template>
  <div 
    v-if="visible" 
    ref="contextMenu"
    class="context-menu"
    :style="menuStyle"
    @click.stop
  >
    <!-- 基础编辑功能 -->
    <div class="context-menu-item" @click="copyText">
      <span class="menu-icon">📋</span>
      {{ $t('editor.contextMenu.copy') }}
    </div>
    <div class="context-menu-item" @click="cutText">
      <span class="menu-icon">✂️</span>
      {{ $t('editor.contextMenu.cut') }}
    </div>
    <div class="context-menu-item" @click="pasteText">
      <span class="menu-icon">📄</span>
      {{ $t('editor.contextMenu.paste') }}
    </div>
    
    <div class="menu-divider"></div>
    
    <!-- AI重写功能 -->
    <div 
      class="context-menu-item submenu-trigger"
      @mouseenter="showAISubmenu = true"
      @mouseleave="hideAISubmenuDelayed"
    >
      <span class="menu-icon">🤖</span>
      {{ $t('editor.contextMenu.aiRewrite') }}
      <span class="submenu-arrow">▶</span>
      
      <!-- AI重写子菜单 -->
      <div 
        v-if="showAISubmenu"
        class="submenu"
        @mouseenter="cancelHideAISubmenu"
        @mouseleave="hideAISubmenuDelayed"
      >
        <div class="context-menu-item" @click="handleRewrite('expand')">
          <span class="menu-icon">📈</span>
          {{ $t('editor.rewriteTooltip.expand') }}
        </div>
        <div class="context-menu-item" @click="handleRewrite('contract')">
          <span class="menu-icon">📉</span>
          {{ $t('editor.rewriteTooltip.contract') }}
        </div>
        <div class="context-menu-item" @click="handleRewrite('beautify')">
          <span class="menu-icon">✨</span>
          {{ $t('editor.rewriteTooltip.beautify') }}
        </div>
        <div class="menu-divider"></div>
        <div class="context-menu-item" @click="handleRewrite('custom')">
          <span class="menu-icon">⚙️</span>
          {{ $t('editor.rewriteTooltip.custom') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

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
    const { t } = useI18n()
    const contextMenu = ref(null)
    const showAISubmenu = ref(false)
    let hideSubmenuTimer = null

    const menuStyle = computed(() => ({
      position: 'fixed',
      left: `${props.position.x}px`,
      top: `${props.position.y}px`,
      zIndex: 2000
    }))

    const copyText = async () => {
      if (props.selectedText) {
        try {
          await navigator.clipboard.writeText(props.selectedText)
        } catch (error) {
          console.warn('Failed to copy text:', error)
        }
      }
      emit('hide')
    }

    const cutText = async () => {
      if (props.selectedText && props.textareaRef) {
        try {
          await navigator.clipboard.writeText(props.selectedText)
          // 删除选中的文本
          const textarea = props.textareaRef
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const currentValue = textarea.value
          const newValue = currentValue.substring(0, start) + currentValue.substring(end)
          
          // 触发输入事件来更新内容
          textarea.value = newValue
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          
          // 设置光标位置
          textarea.setSelectionRange(start, start)
        } catch (error) {
          console.warn('Failed to cut text:', error)
        }
      }
      emit('hide')
    }

    const pasteText = async () => {
      if (props.textareaRef) {
        try {
          const clipboardText = await navigator.clipboard.readText()
          const textarea = props.textareaRef
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const currentValue = textarea.value
          const newValue = 
            currentValue.substring(0, start) + 
            clipboardText + 
            currentValue.substring(end)
          
          // 触发输入事件来更新内容
          textarea.value = newValue
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          
          // 设置光标位置
          const newCursorPos = start + clipboardText.length
          textarea.setSelectionRange(newCursorPos, newCursorPos)
        } catch (error) {
          console.warn('Failed to paste text:', error)
        }
      }
      emit('hide')
    }

    const handleRewrite = (type) => {
      emit('rewrite', type)
      emit('hide')
    }

    const hideAISubmenuDelayed = () => {
      hideSubmenuTimer = setTimeout(() => {
        showAISubmenu.value = false
      }, 300)
    }

    const cancelHideAISubmenu = () => {
      if (hideSubmenuTimer) {
        clearTimeout(hideSubmenuTimer)
        hideSubmenuTimer = null
      }
    }

    return {
      contextMenu,
      showAISubmenu,
      menuStyle,
      copyText,
      cutText,
      pasteText,
      handleRewrite,
      hideAISubmenuDelayed,
      cancelHideAISubmenu
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
  min-width: 180px;
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

.submenu-trigger {
  justify-content: space-between;
}

.submenu-arrow {
  font-size: 10px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.submenu-trigger:hover .submenu-arrow {
  color: var(--accent-color);
}

.submenu {
  position: absolute;
  left: 100%;
  top: 0;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  padding: 4px 0;
  min-width: 160px;
  backdrop-filter: blur(8px);
  margin-left: 4px;
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

</style>