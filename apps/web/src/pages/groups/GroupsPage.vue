<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'

const route = useRoute()

const catalogQuery = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))

const seedGroups = [
  {
    code: 'WEBSPRING26',
    access: 'OPEN',
    status: 'ACTIVE',
  },
  {
    code: 'MATHLAB26',
    access: 'BY_REQUEST',
    status: 'ACTIVE',
  },
  {
    code: 'ARCHIVE26',
    access: 'CLOSED',
    status: 'ARCHIVED',
  },
]
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">App Shell / Groups</span>
      <h1 class="page-title">Главный вход в продукт теперь готовится вокруг раздела `Группы`.</h1>
      <p class="page-lead">
        На этом шаге собран route-level skeleton для списка, каталога, создания группы и join-by-code. Реальные query,
        фильтры и CTA подключатся на шаге 7.
      </p>
      <p v-if="catalogQuery" class="panel-note">Глобальный поиск уже приводит сюда с query: {{ catalogQuery }}</p>
    </header>

    <div class="metric-grid">
      <AppCard>
        <div class="metric">
          <span class="metric__value">2</span>
          <span class="metric__label">Активные группы</span>
        </div>
      </AppCard>
      <AppCard>
        <div class="metric">
          <span class="metric__value">1</span>
          <span class="metric__label">Архивные сценарии</span>
        </div>
      </AppCard>
      <AppCard>
        <div class="metric">
          <span class="metric__value">3</span>
          <span class="metric__label">Seed-кейса для ручной проверки</span>
        </div>
      </AppCard>
    </div>

    <div class="section-grid">
      <AppCard class="span-7">
        <h2 class="section-title">Каркас каталога</h2>
        <div class="pill-list">
          <span class="pill">Мои</span>
          <span class="pill">Все</span>
          <span class="pill">Поиск</span>
          <span class="pill">Access mode</span>
        </div>

        <div class="groups-preview">
          <article v-for="group in seedGroups" :key="group.code" class="groups-preview__item">
            <div>
              <strong>{{ group.code }}</strong>
              <p class="muted">{{ group.access }} · {{ group.status }}</p>
            </div>
            <AppButton :to="`/groups/${group.code}/overview`" variant="ghost" size="sm">Открыть каркас</AppButton>
          </article>
        </div>
      </AppCard>

      <AppCard class="span-5" tone="muted">
        <AppEmptyState
          title="Новый пользователь без групп"
          description="Пустое состояние уже выделено как отдельный блок с явными CTA вместо старого мокового дашборда."
        >
          <template #actions>
            <AppButton to="/groups/create" size="sm">Создать группу</AppButton>
            <AppButton to="/groups/join" variant="secondary" size="sm">Ввести код</AppButton>
          </template>
        </AppEmptyState>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.groups-preview {
  display: grid;
  gap: 0.85rem;
}

.groups-preview__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.52);
}

@media (max-width: 640px) {
  .groups-preview__item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
