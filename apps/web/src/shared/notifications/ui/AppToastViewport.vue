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
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(18px);
  border: 1px solid rgb(199 197 211 / 32%);
  border-radius: var(--radius-md);
  box-shadow: 0 24px 60px -34px rgb(21 25 108 / 45%);
  color: var(--color-text);
  display: grid;
  gap: 10px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 58px;
  overflow: hidden;
  padding: 14px 12px 18px 14px;
  position: relative;
  width: 100%;
}

.toast-card--error {
  background: #fff4f2;
  border-color: rgb(186 26 26 / 30%);
  color: #410002;
}

.toast-card--success {
  background: #effaf1;
  border-color: rgb(17 120 59 / 30%);
  color: #03210f;
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
  background: rgb(255 255 255 / 52%);
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
