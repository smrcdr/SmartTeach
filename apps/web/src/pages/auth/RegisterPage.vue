<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { getAuthErrorMessage } from '../../features/auth/api/auth.api'
import AuthPageShell from '../../features/auth/components/AuthPageShell.vue'
import { useAuth } from '../../features/auth/composables/useAuth'
import AppButton from '../../shared/ui/AppButton.vue'
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
  <AuthPageShell
    title="Регистрация"
    alternate-label="Уже есть аккаунт?"
    alternate-action-label="Войти"
    alternate-to="/login"
  >
    <form class="auth-page__form" @submit.prevent="handleSubmit">
      <AppInput
        v-model="displayName"
        label="Имя в системе"
        autocomplete="name"
        hint="Это имя будет видно участникам группы, в чатах и списках."
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
  </AuthPageShell>
</template>

<style scoped>
.auth-page__form {
  display: grid;
  gap: 1rem;
}

</style>
