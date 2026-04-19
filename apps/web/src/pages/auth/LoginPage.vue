<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getAuthErrorMessage } from '../../features/auth/api/auth.api'
import { useAuth } from '../../features/auth/composables/useAuth'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppInput from '../../shared/ui/AppInput.vue'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()

const email = ref('alex.teacher@smarteach.local')
const password = ref('Password123!')
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
  <div class="auth-page section-grid">
    <AppCard class="span-7">
      <div class="page-header">
        <span class="page-eyebrow">Public / Auth</span>
        <h1 class="page-title">Вход в SmartTeach</h1>
        <p class="page-lead">
          Экран уже работает с cookie-based auth flow: логин обновляет in-memory access token, запрашивает `/auth/me`
          и возвращает пользователя в приватную часть приложения.
        </p>
      </div>

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
    </AppCard>

    <AppCard class="span-5" tone="muted">
      <h2 class="auth-page__title">Seed-пользователь для smoke-проверки</h2>
      <ul class="list-copy">
        <li>`alex.teacher@smarteach.local`</li>
        <li>Пароль: `Password123!`</li>
        <li>После auth пользователь должен уходить в раздел `Группы`</li>
        <li v-if="typeof route.query.redirect === 'string'">После входа откроется ранее запрошенный приватный раздел</li>
      </ul>
    </AppCard>
  </div>
</template>

<style scoped>
.auth-page__form {
  display: grid;
  gap: 1rem;
}

.auth-page__title {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}
</style>
