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
    eyebrow="Регистрация"
    title="Создайте аккаунт и сразу переходите в рабочие группы."
    description="SmartTeach не прячет регистрацию внутри общего auth-tab. Это отдельный маршрут с собственным фокусом: создать аккаунт и сразу открыть приватную часть приложения."
    alternate-label="Уже есть аккаунт?"
    alternate-action-label="Войти"
    alternate-to="/login"
    aside-tone="accent"
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

    <template #meta>
      <div class="auth-page__meta">
        <strong>После регистрации:</strong>
        <span>новый пользователь автоматически входит в систему и открывает раздел групп.</span>
      </div>
    </template>

    <template #aside>
      <span class="page-eyebrow">Что важно на старте</span>
      <h2 class="auth-page__title">Регистрация запускает рабочий сценарий сразу, без лишнего onboarding.</h2>
      <p class="muted">
        Пользователь создает аккаунт один раз, после чего попадает в приватную часть продукта и продолжает работу уже
        внутри группового workspace.
      </p>
      <ul class="list-copy">
        <li>форма живет отдельно от входа и не конкурирует за внимание с другим действием</li>
        <li>имя пользователя задается сразу, чтобы группа и чаты отображали его корректно</li>
        <li>переход в рабочую часть происходит сразу после успешной регистрации</li>
      </ul>
      <div class="panel-note">
        Отдельная страница регистрации помогает держать публичную часть понятной: пользователь либо входит в систему,
        либо создает новый аккаунт, без смешения сценариев в одном экране.
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
  border: 1px solid rgba(31, 117, 156, 0.16);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-subtle);
}

.auth-page__meta strong {
  color: var(--color-text);
}
</style>
