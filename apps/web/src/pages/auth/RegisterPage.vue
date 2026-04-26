<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'

const auth = useAuthStore()
const router = useRouter()
const form = reactive({
  name: '',
  email: '',
  password: ''
})

async function submit() {
  await auth.register(form)
  await router.push('/my-groups')
}
</script>

<template>
  <main class="page auth-page">
    <section class="auth-page__panel surface-panel">
      <AppPageHeader
        eyebrow="Новый профиль"
        title="Регистрация"
        description="Создайте аккаунт и начните работу с учебными группами SmarTeach."
      />
      <form class="auth-page__form" @submit.prevent="submit">
        <AppTextField v-model="form.name" label="Имя" placeholder="Алекс Ривера" />
        <AppTextField v-model="form.email" label="Email" type="email" placeholder="alex@example.com" />
        <AppTextField v-model="form.password" label="Пароль" type="password" placeholder="Минимум 8 символов" />
        <p v-if="auth.error" class="auth-page__error">{{ auth.error }}</p>
        <AppButton type="submit">{{ auth.isLoading ? 'Создаём...' : 'Создать аккаунт' }}</AppButton>
      </form>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: grid;
  place-items: center;
}

.auth-page__panel {
  max-width: 620px;
  padding: clamp(28px, 5vw, 44px);
  width: 100%;
}

.auth-page__form {
  display: grid;
  gap: 16px;
}

.auth-page__error {
  color: var(--color-error);
  margin: 0;
}
</style>
