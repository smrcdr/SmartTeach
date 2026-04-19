<script setup lang="ts">
import { appName, appTagline } from '../../app/config/brand'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'

const benefits = [
  {
    title: 'Группа становится центром работы',
    description: 'После входа пользователь попадает сразу к реальным группам, а не на декоративный общий экран.',
  },
  {
    title: 'Модули включаются по задаче',
    description: 'Уроки, задания, расписание и чаты живут в одном рабочем пространстве и не расползаются по разным интерфейсам.',
  },
  {
    title: 'Публичная часть остается компактной',
    description: 'Публичная страница, вход и регистрация только заводят пользователя в продукт. Вся работа начинается уже после авторизации.',
  },
]

const entryPoints = [
  {
    title: 'Мои группы',
    description: 'Список активных и архивных групп без промежуточных экранов и лишних переходов.',
  },
  {
    title: 'Задания и уроки',
    description: 'Материалы, дедлайны и статусы собираются в рамках той группы, где идет работа.',
  },
  {
    title: 'Расписание и чаты',
    description: 'События, дедлайны и обсуждения остаются рядом с остальным учебным процессом.',
  },
]

const scenarios = [
  {
    title: 'Преподаватель',
    description: 'Создает группу, включает нужные модули и ведет уроки, задания и расписание из одного места.',
  },
  {
    title: 'Студент',
    description: 'Следит за своими группами, быстро открывает дедлайны и не теряет контекст между материалами и чатами.',
  },
  {
    title: 'Куратор или ментор',
    description: 'Держит учебный ритм группы под контролем и координирует участников без отдельного набора сервисов.',
  },
]

const modules = ['Группы', 'Уроки', 'Задания', 'Расписание', 'Чаты']
</script>

<template>
  <div class="landing-page page-shell">
    <section class="landing-hero">
      <div class="landing-hero__copy">
        <div class="page-header">
          <span class="page-eyebrow">Публичная зона</span>
          <h1 class="page-title">{{ appName }} собирает учебную группу в один рабочий контур.</h1>
          <p class="page-lead">
            {{ appTagline }} SmartTeach помогает входить в рабочий ритм без лишних переходов: пользователь
            авторизуется, открывает свои группы и продолжает работу внутри знакомого рабочего пространства группы.
          </p>
        </div>

        <div class="page-actions">
          <AppButton to="/login">Войти</AppButton>
          <AppButton to="/register" variant="secondary">Зарегистрироваться</AppButton>
        </div>

        <div class="pill-list">
          <span v-for="module in modules" :key="module" class="pill">{{ module }}</span>
        </div>
      </div>

      <AppCard class="landing-hero__summary" tone="accent">
        <span class="page-eyebrow">После входа</span>
        <h2 class="landing-section__title">Публичная часть короткая, рабочая часть начинается сразу после входа.</h2>
        <p class="page-lead">
          Внутри продукта нет отдельного глобального дашборда. Пользователь открывает группы и работает в контексте
          уроков, заданий, расписания и чатов той группы, где находится.
        </p>

        <div class="landing-hero__checklist">
          <div v-for="entryPoint in entryPoints" :key="entryPoint.title" class="landing-hero__checklist-item">
            <strong>{{ entryPoint.title }}</strong>
            <p>{{ entryPoint.description }}</p>
          </div>
        </div>
      </AppCard>
    </section>

    <section class="landing-section">
      <div class="landing-section__header">
        <span class="page-eyebrow">Почему так устроено</span>
        <h2 class="landing-section__title">Публичная зона не притворяется рабочим кабинетом.</h2>
        <p class="page-lead">
          Она только знакомит с продуктом и заводит пользователя в приватную часть приложения. Вся остальная навигация
          появляется уже внутри авторизованного пространства.
        </p>
      </div>

      <div class="section-grid">
        <AppCard v-for="benefit in benefits" :key="benefit.title" class="span-4 benefit-card">
          <span class="benefit-card__kicker">Преимущество</span>
          <h3 class="landing-card__title">{{ benefit.title }}</h3>
          <p class="muted">{{ benefit.description }}</p>
        </AppCard>
      </div>
    </section>

    <section class="landing-section">
      <div class="landing-section__header">
        <span class="page-eyebrow">Сценарии использования</span>
        <h2 class="landing-section__title">Разные роли заходят в один и тот же продуктовый контур.</h2>
      </div>

      <div class="section-grid">
        <AppCard v-for="scenario in scenarios" :key="scenario.title" class="span-4 scenario-card" tone="muted">
          <h3 class="landing-card__title">{{ scenario.title }}</h3>
          <p class="muted">{{ scenario.description }}</p>
        </AppCard>
      </div>
    </section>

    <AppCard class="landing-cta" tone="accent">
      <div class="landing-cta__copy">
        <span class="page-eyebrow">Начать работу</span>
        <h2 class="landing-section__title">Войдите в существующий аккаунт или создайте новый, чтобы открыть группы.</h2>
        <p class="muted">
          После регистрации SmartTeach сразу переводит пользователя в раздел групп и не заставляет проходить отдельный
          вводный сценарий.
        </p>
      </div>

      <div class="page-actions">
        <AppButton to="/login">Войти</AppButton>
        <AppButton to="/register" variant="secondary">Регистрация</AppButton>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.landing-page {
  gap: 1.25rem;
}

.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
  gap: 1rem;
  align-items: stretch;
}

.landing-hero__copy {
  display: grid;
  gap: 1.25rem;
  padding: clamp(1.6rem, 4vw, 2.6rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: var(--shadow-md);
}

.landing-hero__summary {
  height: 100%;
  align-content: start;
}

.landing-hero__checklist {
  display: grid;
  gap: 0.85rem;
}

.landing-hero__checklist-item {
  display: grid;
  gap: 0.3rem;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(31, 117, 156, 0.14);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.78);
}

.landing-hero__checklist-item strong {
  font-size: 0.98rem;
  letter-spacing: -0.02em;
}

.landing-hero__checklist-item p {
  color: var(--color-subtle);
}

.landing-section {
  display: grid;
  gap: 1rem;
}

.landing-section__header {
  display: grid;
  gap: 0.5rem;
}

.landing-section__title,
.landing-card__title {
  letter-spacing: -0.03em;
}

.landing-section__title {
  font-size: clamp(1.45rem, 2.4vw, 2rem);
}

.landing-card__title {
  font-size: 1.12rem;
}

.benefit-card,
.scenario-card {
  height: 100%;
}

.benefit-card__kicker {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.landing-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.landing-cta__copy {
  display: grid;
  gap: 0.5rem;
  max-width: 44rem;
}

@media (max-width: 960px) {
  .landing-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .landing-hero__copy {
    padding: 1.35rem;
  }
}
</style>
