<script setup lang="ts">
import { CircleAlert, CircleCheck, X } from 'lucide-vue-next'
import { useNotificationStore } from '../stores/notifications.store'

const notifications = useNotificationStore()
</script>

<template>
  <section
    v-if="notifications.items.length > 0"
    class="toast-viewport"
    aria-label="Уведомления"
    aria-live="polite"
    aria-relevant="additions removals"
  >
    <article
      v-for="item in notifications.items"
      :key="item.id"
      :class="['toast-card', `toast-card--${item.type}`]"
      role="status"
    >
      <CircleCheck v-if="item.type === 'success'" class="toast-card__icon" :size="20" />
      <CircleAlert v-else class="toast-card__icon" :size="20" />
      <p>{{ item.message }}</p>
      <button
        class="toast-card__close"
        type="button"
        aria-label="Закрыть уведомление"
        @click="notifications.remove(item.id)"
      >
        <X :size="16" />
      </button>
    </article>
  </section>
</template>

<style scoped>
.toast-viewport {
  align-items: flex-end;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: min(420px, calc(100vw - 32px));
  position: fixed;
  right: 24px;
  width: max-content;
  z-index: 80;
}

.toast-card {
  align-items: flex-start;
  background: rgb(255 255 255 / 94%);
  backdrop-filter: blur(18px);
  border: 1px solid rgb(199 197 211 / 32%);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-md);
  box-shadow: 0 24px 60px -34px rgb(21 25 108 / 45%);
  color: var(--color-text);
  display: grid;
  gap: 10px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 58px;
  padding: 14px 12px 14px 14px;
  width: 100%;
}

.toast-card--error {
  border-left-color: var(--color-error);
}

.toast-card--success {
  border-left-color: #11783b;
}

.toast-card__icon {
  color: var(--color-primary);
  margin-top: 1px;
}

.toast-card--error .toast-card__icon {
  color: var(--color-error);
}

.toast-card--success .toast-card__icon {
  color: #11783b;
}

.toast-card p {
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.45;
  margin: 0;
}

.toast-card__close {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: var(--radius-xs);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 28px;
  justify-content: center;
  padding: 0;
  width: 28px;
}

.toast-card__close:hover {
  background: var(--color-surface-low);
  color: var(--color-text);
}

@media (max-width: 640px) {
  .toast-viewport {
    bottom: 16px;
    left: 16px;
    right: 16px;
    width: auto;
  }
}
</style>
