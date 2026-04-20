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
    title="Вход"
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
  </AuthPageShell>
</template>

<style scoped>
.auth-page__form {
  display: grid;
  gap: 1rem;
}

</style>
