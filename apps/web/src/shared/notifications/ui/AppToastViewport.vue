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
      <CircleCheck v-if="item.type === 'success'" class="toast-card__icon" :size="22" />
      <CircleAlert v-else class="toast-card__icon" :size="22" />
      <p>{{ item.message }}</p>
      <button
        class="toast-card__close"
        type="button"
        aria-label="Закрыть уведомление"
        @click="notifications.remove(item.id)"
      >
        <X :size="18" />
      </button>
      <span class="toast-card__timer" aria-hidden="true">
        <span
          class="toast-card__timer-bar"
          :style="{ animationDuration: `${item.timeoutMs}ms` }"
        />
      </span>
    </article>
  </section>
</template>

<style scoped>
.toast-viewport {
  align-items: flex-end;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: min(480px, calc(100vw - 32px));
  position: fixed;
  right: 28px;
  width: max-content;
  z-index: 80;
}

.toast-card {
  align-items: flex-start;
  background: var(--color-toast-surface);
  backdrop-filter: blur(18px);
  border: 1px solid var(--color-toast-border);
  border-radius: var(--radius-md);
  box-shadow: 0 26px 64px -30px rgb(21 25 108 / 50%);
  color: var(--color-text);
  display: grid;
  gap: 12px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 72px;
  overflow: hidden;
  padding: 18px 16px 22px 18px;
  position: relative;
  width: 100%;
}

.toast-card--error {
  background: #fee2e2;
  border-color: #dc2626;
  color: #7f1d1d;
}

.toast-card--success {
  background: #dcfce7;
  border-color: #16a34a;
  color: #14532d;
}

.toast-card__icon {
  color: var(--color-primary);
  margin-top: 1px;
}

.toast-card--error .toast-card__icon {
  color: #dc2626;
}

.toast-card--success .toast-card__icon {
  color: #16a34a;
}

.toast-card p {
  font-size: 1rem;
  font-weight: 750;
  line-height: 1.5;
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
  height: 32px;
  justify-content: center;
  padding: 0;
  width: 32px;
}

.toast-card__close:hover {
  background: var(--color-toast-close-hover);
  color: currentColor;
}

.toast-card__timer {
  background: rgb(0 0 0 / 8%);
  bottom: 0;
  height: 4px;
  left: 0;
  overflow: hidden;
  position: absolute;
  right: 0;
}

.toast-card__timer-bar {
  animation: toast-timer linear forwards;
  background: currentColor;
  display: block;
  height: 100%;
  transform-origin: left center;
  width: 100%;
}

@keyframes toast-timer {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
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
