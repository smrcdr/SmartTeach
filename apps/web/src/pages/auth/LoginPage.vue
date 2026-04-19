<script setup lang="ts">
import { ref } from 'vue'

import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppInput from '../../shared/ui/AppInput.vue'

const email = ref('alex.teacher@smarteach.local')
const password = ref('Password123!')
</script>

<template>
  <div class="auth-page section-grid">
    <AppCard class="span-7">
      <div class="page-header">
        <span class="page-eyebrow">Public / Auth</span>
        <h1 class="page-title">Вход в SmartTeach</h1>
        <p class="page-lead">
          Этот экран уже живет в отдельном public layout. Реальный login flow, session bootstrap и guards подключатся
          на шаге 5.
        </p>
      </div>

      <form class="auth-page__form" @submit.prevent>
        <AppInput v-model="email" label="Email" type="email" autocomplete="username" />
        <AppInput v-model="password" label="Пароль" type="password" autocomplete="current-password" />
        <AppButton type="submit" block>Подключить login flow на шаге 5</AppButton>
      </form>
    </AppCard>

    <AppCard class="span-5" tone="muted">
      <h2 class="auth-page__title">Seed-пользователь для smoke-проверки</h2>
      <ul class="list-copy">
        <li>`alex.teacher@smarteach.local`</li>
        <li>Пароль: `Password123!`</li>
        <li>После auth пользователь должен уходить в раздел `Группы`</li>
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
