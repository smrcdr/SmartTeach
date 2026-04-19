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
          Шаг 4 переводит SmartTeach на новый application skeleton: public entry, app shell и отдельный локальный
          workspace группы уже разведены по layout-уровням.
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
          <li>`main.ts` теперь поднимает `Pinia` и `Vue Query` до появления feature-логики</li>
          <li>общие layout-компоненты уже различают public, app и group contexts</li>
        </ul>
      </AppCard>

      <AppCard class="span-5">
        <h2 class="card-title">Следом по плану</h2>
        <p class="muted">
          Следующий шаг подключит auth bootstrap, guards и приватную маршрутизацию поверх этого каркаса, без возврата к
          старой моковой оболочке.
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
