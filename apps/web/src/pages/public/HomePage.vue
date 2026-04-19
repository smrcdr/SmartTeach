<script setup lang="ts">
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'

const pillars = [
  {
    title: 'Группы как центр продукта',
    description: 'После логина приложение ведет в рабочий список групп, а не в декоративный dashboard.',
  },
  {
    title: 'Модули внутри workspace',
    description: 'Уроки, задания, расписание и чаты разворачиваются как отдельные разделы одной группы.',
  },
  {
    title: 'API-first каркас',
    description: 'Новый frontend уже опирается на router/layout/providers foundation, подготовленный под OpenAPI client.',
  },
]
</script>

<template>
  <div class="page-shell">
    <section class="hero">
      <div class="page-header">
        <span class="page-eyebrow">Frontend MVP</span>
        <h1 class="page-title">Один workspace для учебных групп, а не набор несвязанных мок-экранов.</h1>
        <p class="page-lead">
          SmartTeach уже держит cookie-based auth foundation: public entry, app shell, silent refresh и приватная
          маршрутизация больше не завязаны на старую моковую оболочку.
        </p>
      </div>

      <div class="page-actions">
        <AppButton to="/login">Войти</AppButton>
        <AppButton to="/register" variant="secondary">Создать аккаунт</AppButton>
      </div>
    </section>

    <div class="section-grid">
      <AppCard v-for="pillar in pillars" :key="pillar.title" class="span-4">
        <h2 class="card-title">{{ pillar.title }}</h2>
        <p class="muted">{{ pillar.description }}</p>
      </AppCard>
    </div>

    <div class="section-grid">
      <AppCard class="span-7" tone="accent">
        <h2 class="card-title">Что уже готово на этом шаге</h2>
        <ul class="list-copy">
          <li>router разбит на `index`, `routes` и `guards`, а не держится на одном `router.ts`</li>
          <li>auth store восстанавливает сессию через `/auth/refresh` и затем поднимает `/auth/me`</li>
          <li>retry after refresh и logout redirect централизованы в transport-слое</li>
          <li>общие layout-компоненты уже различают public, app и group contexts</li>
        </ul>
      </AppCard>

      <AppCard class="span-5">
        <h2 class="card-title">Дальше по плану</h2>
        <p class="muted">
          Следующий шаг доберет продуктовую публичную зону: landing, login и register можно будет полировать уже поверх
          работающего auth foundation, а не поверх временных заглушек.
        </p>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: grid;
  gap: 1.25rem;
  padding: clamp(1.6rem, 4vw, 2.4rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(237, 245, 250, 0.9));
  box-shadow: var(--shadow-md);
}

.card-title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}
</style>
