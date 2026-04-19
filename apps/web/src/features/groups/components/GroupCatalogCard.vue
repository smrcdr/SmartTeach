<script setup lang="ts">
import { computed } from 'vue'

import AppButton from '../../../shared/ui/AppButton.vue'
import AppCard from '../../../shared/ui/AppCard.vue'
import type { Group } from '../api/groups.api'
import {
  formatMembersCount,
  getEnabledGroupModules,
  groupAccessModeLabels,
  groupStatusLabels,
} from '../lib/groups.ui'
import GroupModuleBadges from './GroupModuleBadges.vue'

const props = defineProps<{
  group: Group
  isJoined: boolean
}>()

const moduleLabels = computed(() => getEnabledGroupModules(props.group.settings))
const membersLabel = computed(() => formatMembersCount(props.group.membersCount))
const accessLabel = computed(() => groupAccessModeLabels[props.group.accessMode])
const statusLabel = computed(() => groupStatusLabels[props.group.status])
const actionLabel = computed(() => (props.isJoined ? 'Перейти в workspace' : 'Открыть группу'))
const actionTarget = computed(() => (props.isJoined ? `/groups/${props.group.id}/overview` : `/groups/${props.group.id}`))
</script>

<template>
  <AppCard class="catalog-card" :tone="isJoined ? 'accent' : 'default'">
    <div class="catalog-card__header">
      <div class="catalog-card__copy">
        <div class="catalog-card__meta">
          <span class="catalog-card__code">{{ group.code }}</span>
          <span :class="['catalog-card__badge', `catalog-card__badge--${group.accessMode.toLowerCase()}`]">
            {{ accessLabel }}
          </span>
          <span v-if="group.status !== 'ACTIVE'" class="catalog-card__status">{{ statusLabel }}</span>
          <span v-if="isJoined" class="catalog-card__status catalog-card__status--joined">Вы уже внутри</span>
        </div>
        <h2 class="catalog-card__title">{{ group.name }}</h2>
        <p class="catalog-card__description">
          {{ group.description ?? 'Описание пока не добавлено, но группа уже видима в каталоге.' }}
        </p>
      </div>

      <AppButton :to="actionTarget" :variant="isJoined ? 'primary' : 'secondary'" size="sm">
        {{ actionLabel }}
      </AppButton>
    </div>

    <dl class="catalog-card__facts">
      <div>
        <dt>Владелец</dt>
        <dd>{{ group.owner.displayName }}</dd>
      </div>
      <div>
        <dt>Участники</dt>
        <dd>{{ membersLabel }}</dd>
      </div>
      <div>
        <dt>Доступ</dt>
        <dd>{{ accessLabel }}</dd>
      </div>
    </dl>

    <GroupModuleBadges :modules="moduleLabels" />
  </AppCard>
</template>

<style scoped>
.catalog-card {
  height: 100%;
}

.catalog-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.catalog-card__copy {
  display: grid;
  gap: 0.65rem;
}

.catalog-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.catalog-card__code,
.catalog-card__badge,
.catalog-card__status {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.68rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 800;
}

.catalog-card__code {
  border: 1px solid var(--color-border);
  background: var(--color-panel-muted);
  color: var(--color-subtle);
}

.catalog-card__badge {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.catalog-card__badge--by_request {
  background: rgba(20, 32, 51, 0.08);
  color: var(--color-text);
}

.catalog-card__badge--closed {
  background: rgba(156, 71, 71, 0.1);
  color: var(--color-danger);
}

.catalog-card__status {
  background: rgba(20, 32, 51, 0.08);
  color: var(--color-text);
}

.catalog-card__status--joined {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.catalog-card__title {
  font-size: 1.3rem;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.catalog-card__description {
  color: var(--color-subtle);
}

.catalog-card__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.catalog-card__facts div {
  display: grid;
  gap: 0.28rem;
}

.catalog-card__facts dt {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.catalog-card__facts dd {
  margin: 0;
  font-weight: 700;
}

@media (max-width: 720px) {
  .catalog-card__header {
    flex-direction: column;
  }

  .catalog-card__facts {
    grid-template-columns: 1fr;
  }
}
</style>
