<script setup lang="ts">
import { computed } from 'vue'
import { reactive } from 'vue'
import { GraduationCap, MessagesSquare, ShieldCheck } from 'lucide-vue-next'
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
  <main class="page auth-page">
    <section class="auth-shell">
      <div class="auth-shell__story">
        <span class="eyebrow">Новый профиль</span>
        <h1 class="page-title">Регистрация</h1>
        <p class="lead">Создайте аккаунт, чтобы присоединяться к группам, получать задания и общаться в чатах.</p>
        <div class="auth-shell__features">
          <span><GraduationCap :size="18" /> Курсы и классы</span>
          <span><MessagesSquare :size="18" /> Чаты</span>
          <span><ShieldCheck :size="18" /> Защищённый доступ</span>
        </div>
      </div>

      <form class="auth-card" @submit.prevent="submit">
        <div class="auth-card__header">
          <span class="eyebrow">Аккаунт</span>
          <h2>Создать профиль</h2>
          <p>Имя будет видно участникам ваших учебных групп.</p>
        </div>
        <AppTextField v-model="form.displayName" label="Имя" placeholder="Student Example" />
        <AppTextField v-model="form.email" label="Email" type="email" placeholder="student@smarteach.local" />
        <AppTextField v-model="form.password" label="Пароль" type="password" placeholder="Password123!" />
        <p v-if="auth.error" class="auth-page__error">{{ auth.error }}</p>
        <AppButton type="submit" size="lg">{{ auth.isLoading ? 'Создаём...' : 'Создать аккаунт' }}</AppButton>
        <RouterLink class="auth-card__link" to="/login">Уже есть аккаунт? Войти</RouterLink>
      </form>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
}

.auth-shell {
  align-items: stretch;
  display: grid;
  gap: 32px;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 520px);
  margin: 0 auto;
  max-width: 1180px;
}

.auth-shell__story,
.auth-card {
  display: grid;
}

.auth-shell__story {
  align-content: center;
  background: var(--color-surface-low);
  border-radius: var(--radius-lg);
  gap: 24px;
  padding: clamp(32px, 5vw, 58px);
}

.auth-shell__features {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.auth-shell__features span {
  align-items: center;
  background: var(--color-surface-lowest);
  border-radius: 999px;
  color: var(--color-text-muted);
  display: inline-flex;
  font-size: 0.86rem;
  font-weight: 700;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
}

.auth-card {
  align-content: center;
  background: var(--color-surface-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  gap: 17px;
  padding: clamp(28px, 5vw, 44px);
}

.auth-card__header h2,
.auth-card__header p {
  margin: 0;
}

.auth-card__header h2 {
  color: var(--color-primary);
  font-size: 2rem;
  margin-bottom: 8px;
}

.auth-card__header p,
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

@media (max-width: 900px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }
}
</style>
