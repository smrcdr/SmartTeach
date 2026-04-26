<script setup lang="ts">
import { computed } from 'vue'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = reactive({
  displayName: '',
  email: '',
  password: ''
})

const redirectTarget = computed(() => typeof route.query.redirect === 'string' ? route.query.redirect : '/my-groups')

async function submit() {
  await auth.register(form)
  await router.push(redirectTarget.value)
}
</script>

<template>
  <main class="page auth-page auth-page--centered">
    <section class="auth-shell">
      <form class="auth-card" @submit.prevent="submit">
        <div class="auth-card__header">
          <span class="eyebrow">Аккаунт</span>
          <h2>Регистрация</h2>
        </div>
        <AppTextField v-model="form.displayName" label="Имя" placeholder="Введите имя" />
        <AppTextField v-model="form.email" label="Email" type="email" placeholder="Введите email" />
        <AppTextField v-model="form.password" label="Пароль" type="password" placeholder="Введите пароль" />
        <p v-if="auth.error" class="auth-page__error">{{ auth.error }}</p>
        <AppButton type="submit" size="lg">{{ auth.isLoading ? 'Создаём...' : 'Создать аккаунт' }}</AppButton>
        <RouterLink class="auth-card__link" to="/login">Уже есть аккаунт? Войти</RouterLink>
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
  max-width: 560px;
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

.auth-page__error {
  color: var(--color-error);
  margin: 0;
}

</style>
