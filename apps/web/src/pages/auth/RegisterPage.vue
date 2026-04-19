<script setup lang="ts">
import { ref } from 'vue'

import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppInput from '../../shared/ui/AppInput.vue'

const displayName = ref('Student Example')
const email = ref('student@smarteach.local')
const password = ref('Password123!')
</script>

<template>
  <div class="auth-page section-grid">
    <AppCard class="span-7">
      <div class="page-header">
        <span class="page-eyebrow">Public / Auth</span>
        <h1 class="page-title">Регистрация</h1>
        <p class="page-lead">
          Каркас уже разделяет регистрацию и вход на два отдельных route. Автовход после signup и cookie-session flow
          добавятся следующими шагами.
        </p>
      </div>

      <form class="auth-page__form" @submit.prevent>
        <AppInput v-model="displayName" label="Display name" autocomplete="name" />
        <AppInput v-model="email" label="Email" type="email" autocomplete="email" />
        <AppInput v-model="password" label="Пароль" type="password" autocomplete="new-password" />
        <AppButton type="submit" block>Подключить register flow на шаге 5</AppButton>
      </form>
    </AppCard>

    <AppCard class="span-5" tone="accent">
      <h2 class="auth-page__title">Контракт уже учтен</h2>
      <ul class="list-copy">
        <li>форма не смешана с логином и не прячется в одном route с табами</li>
        <li>в каркас включен `displayName`, который реально существует в `RegisterRequest`</li>
        <li>после шага 5 успешная регистрация должна сразу авторизовать пользователя</li>
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
