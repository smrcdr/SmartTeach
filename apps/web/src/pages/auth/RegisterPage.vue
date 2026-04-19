<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { getAuthErrorMessage } from '../../features/auth/api/auth.api'
import { useAuth } from '../../features/auth/composables/useAuth'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppInput from '../../shared/ui/AppInput.vue'

const router = useRouter()
const { register } = useAuth()

const displayName = ref('')
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
    await register({
      displayName: displayName.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })

    await router.replace('/groups')
  } catch (error) {
    submitError.value = getAuthErrorMessage(error, 'Не удалось зарегистрировать аккаунт')
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
        <h1 class="page-title">Регистрация</h1>
        <p class="page-lead">
          Регистрация сразу создает сессию, поднимает auth state и переводит пользователя в раздел `Группы` без
          отдельного экрана подтверждения.
        </p>
      </div>

      <form class="auth-page__form" @submit.prevent="handleSubmit">
        <AppInput
          v-model="displayName"
          label="Display name"
          autocomplete="name"
          required
          :disabled="isSubmitting"
        />
        <AppInput
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
          required
          :disabled="isSubmitting"
        />
        <AppInput
          v-model="password"
          label="Пароль"
          type="password"
          autocomplete="new-password"
          required
          :disabled="isSubmitting"
        />
        <AppButton type="submit" block :disabled="isSubmitting">
          {{ isSubmitting ? 'Создаем аккаунт...' : 'Зарегистрироваться' }}
        </AppButton>
      </form>

      <AppErrorState
        v-if="submitError"
        title="Не удалось завершить регистрацию"
        :description="submitError"
      />
    </AppCard>

    <AppCard class="span-5" tone="accent">
      <h2 class="auth-page__title">Контракт уже учтен</h2>
      <ul class="list-copy">
        <li>форма не смешана с логином и не прячется в одном route с табами</li>
        <li>в каркас включен `displayName`, который реально существует в `RegisterRequest`</li>
        <li>успешная регистрация сразу авторизует пользователя и ведет в `Группы`</li>
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
