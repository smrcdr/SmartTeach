<script setup lang="ts">
import { reactive } from 'vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const route = useRoute()
const router = useRouter()
const form = reactive({
  email: '',
  password: ''
})

const redirectTarget = computed(() => typeof route.query.redirect === 'string' ? route.query.redirect : '/my-groups')

async function submit() {
  try {
    await auth.login(form)
    notifications.success('Вход выполнен')
    await router.push(redirectTarget.value)
  } catch {
    notifications.error(auth.error ?? 'Не удалось войти')
  }
}
</script>

<template>
  <main class="page auth-page auth-page--centered">
    <section class="auth-shell auth-shell--wide">
      <form class="auth-card auth-card--wide-fields" @submit.prevent="submit">
        <div class="auth-card__header">
          <span class="eyebrow">Сессия</span>
          <h2>Войти</h2>
        </div>
        <AppTextField v-model="form.email" label="Email" type="email" placeholder="Введите email" />
        <AppTextField v-model="form.password" label="Пароль" type="password" placeholder="Введите пароль" />
        <AppButton type="submit" size="lg">{{ auth.isLoading ? 'Входим...' : 'Войти' }}</AppButton>
        <RouterLink class="auth-card__link" to="/register">
          Нет аккаунта? <span class="auth-card__link-action">Зарегистрироваться</span>
        </RouterLink>
      </form>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

.auth-shell {
  display: flex;
  justify-content: center;
  margin: 0 auto;
  max-width: 480px;
  width: min(100%, 480px);
}

.auth-card {
  display: grid;
}

.auth-card {
  align-content: center;
  background: var(--color-surface-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  gap: 17px;
  padding: clamp(28px, 5vw, 44px);
  width: 100%;
}

.auth-card--wide-fields :deep(.field),
.auth-card--wide-fields :deep(.field__control) {
  width: 100%;
}

.auth-card__header h2 {
  margin: 0;
}

.auth-card__header h2 {
  color: var(--color-primary);
  font-size: 2rem;
  margin-bottom: 8px;
}

.auth-card__link {
  color: var(--color-text-muted);
  line-height: 1.55;
}

.auth-card__link {
  font-size: 0.92rem;
  font-weight: 700;
  justify-self: center;
}

.auth-card__link-action {
  color: var(--color-primary);
}

</style>
