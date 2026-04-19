<script setup lang="ts">
import { ref } from 'vue'

import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'
import AppTextarea from '../../shared/ui/AppTextarea.vue'

const bio = ref('Преподаю фронтенд и собираю курс вокруг реальных продуктовых сценариев.')
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">App Shell / Profile</span>
      <h1 class="page-title">Раздел профиля уже живет вне старых mock страниц и готов к API-данным.</h1>
      <p class="page-lead">
        На этом шаге это пока skeleton под `me` и update profile flow, но route и layout уже собраны в финальной
        структуре приложения.
      </p>
    </header>

    <div class="section-grid">
      <AppCard class="span-5">
        <h2 class="section-title">Каркас формы</h2>
        <AppTextarea
          v-model="bio"
          label="Bio"
          hint="Profile update flow и avatar upload подключатся после auth foundation."
        />
        <AppButton variant="secondary">Подключить профиль позже</AppButton>
      </AppCard>

      <AppCard class="span-7" tone="muted">
        <AppLoader label="После auth bootstrap сюда подставится `/auth/me` и profile query." />
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}
</style>
