<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm-container">
      <div class="modal-overlay" @click="handleOverlayClick">
        <ConfirmDialog
          :type="currentConfirm.type"
          :title="currentConfirm.title"
          :message="currentConfirm.message"
          :confirm-text="currentConfirm.confirmText"
          :cancel-text="currentConfirm.cancelText"
          :async-action="currentConfirm.asyncAction"
          @confirm="handleConfirm"
          @cancel="handleCancel"
          @close="handleClose"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useConfirmStore } from '@/stores/confirm'
import ConfirmDialog from './ConfirmDialog.vue'

const confirmStore = useConfirmStore()

const visible = computed(() => confirmStore.isVisible)
const currentConfirm = computed(() => confirmStore.currentConfirm)

const handleConfirm = () => {
  confirmStore.resolve(true)
}

const handleCancel = () => {
  confirmStore.resolve(false)
}

const handleClose = (result) => {
  confirmStore.resolve(result)
}

const handleOverlayClick = () => {
  if (currentConfirm.value?.closeOnOverlay !== false) {
    handleCancel()
  }
}
</script>

<style scoped>
.confirm-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
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
  backdrop-filter: blur(4px);
}
</style>