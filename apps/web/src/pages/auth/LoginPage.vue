<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getAuthErrorMessage } from '../../features/auth/api/auth.api'
import AuthPageShell from '../../features/auth/components/AuthPageShell.vue'
import { useAuth } from '../../features/auth/composables/useAuth'
import AppButton from '../../shared/ui/AppButton.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppInput from '../../shared/ui/AppInput.vue'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const submitError = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    await login({
      email: email.value.trim(),
      password: password.value,
    })

    const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/groups'

    await router.replace(redirectTarget)
  } catch (error) {
    submitError.value = getAuthErrorMessage(error, 'Не удалось войти в систему')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthPageShell
    eyebrow="Вход"
    title="Откройте свои группы и продолжайте работу без лишних переходов."
    description="SmartTeach оставляет вход отдельным маршрутом, а после авторизации сразу переводит пользователя в рабочую зону групп, чатов и учебных модулей."
    alternate-label="Нужен новый аккаунт?"
    alternate-action-label="Зарегистрироваться"
    alternate-to="/register"
  >
    <form class="auth-page__form" @submit.prevent="handleSubmit">
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        autocomplete="username"
        required
        :disabled="isSubmitting"
      />
      <AppInput
        v-model="password"
        label="Пароль"
        type="password"
        autocomplete="current-password"
        required
        :disabled="isSubmitting"
      />
      <AppButton type="submit" block :disabled="isSubmitting">
        {{ isSubmitting ? 'Входим...' : 'Войти' }}
      </AppButton>
    </form>

    <AppErrorState v-if="submitError" title="Не удалось войти" :description="submitError" />

    <template #meta>
      <div v-if="typeof route.query.redirect === 'string'" class="auth-page__meta">
        <strong>После входа откроется:</strong>
        <span>{{ route.query.redirect }}</span>
      </div>
    </template>

    <template #aside>
      <span class="page-eyebrow">Что получает пользователь</span>
      <h2 class="auth-page__title">Сессия остается прозрачной и не размазывается по публичным экранам.</h2>
      <p class="muted">
        После успешного входа SmartTeach поднимает текущего пользователя и возвращает его в рабочую часть продукта
        без промежуточного шага.
      </p>
      <ul class="list-copy">
        <li>после авторизации пользователь сразу попадает в раздел групп</li>
        <li>при возврате по `redirect` открывается ранее запрошенный приватный раздел</li>
        <li>обычная перезагрузка страницы не требует повторного входа</li>
      </ul>
      <div class="panel-note">
        Логин и регистрация живут на отдельных маршрутах, поэтому у каждой страницы остается собственная структура и
        приоритет действий.
      </div>
    </template>
  </AuthPageShell>
</template>

<style scoped>
.auth-page__form {
  display: grid;
  gap: 1rem;
}

.auth-page__title {
  font-size: 1.18rem;
  letter-spacing: -0.03em;
}

.auth-page__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-panel-muted);
  color: var(--color-subtle);
}

.auth-page__meta strong {
  color: var(--color-text);
}
</style>
