<script setup lang="ts">
import { computed } from 'vue'

import AppButton from '../../../shared/ui/AppButton.vue'
import AppCard from '../../../shared/ui/AppCard.vue'
import type { Group } from '../api/groups.api'
import { formatMembersCount, getEnabledGroupModules, getMyGroupRoleLabel, groupStatusLabels } from '../lib/groups.ui'
import GroupModuleBadges from './GroupModuleBadges.vue'

const props = defineProps<{
  group: Group
  currentUserId?: string | null
}>()

const moduleLabels = computed(() => getEnabledGroupModules(props.group.settings))
const membershipLabel = computed(() => getMyGroupRoleLabel(props.group, props.currentUserId))
const membersLabel = computed(() => formatMembersCount(props.group.membersCount))
const statusLabel = computed(() => groupStatusLabels[props.group.status])
</script>

<template>
  <AppCard class="group-card">
    <div class="group-card__header">
      <div class="group-card__copy">
        <div class="group-card__meta">
          <span class="group-card__code">{{ group.code }}</span>
          <span :class="['group-card__badge', `group-card__badge--${group.status.toLowerCase()}`]">
            {{ statusLabel }}
          </span>
        </div>
        <h2 class="group-card__title">{{ group.name }}</h2>
        <p class="group-card__description">
          {{ group.description ?? 'Описание пока не заполнено, но группа уже доступна в рабочем списке.' }}
        </p>
      </div>

      <AppButton :to="`/groups/${group.id}/overview`" size="sm">Открыть группу</AppButton>
    </div>

    <dl class="group-card__facts">
      <div>
        <dt>Ваша роль</dt>
        <dd>{{ membershipLabel }}</dd>
      </div>
      <div>
        <dt>Участники</dt>
        <dd>{{ membersLabel }}</dd>
      </div>
      <div>
        <dt>Владелец</dt>
        <dd>{{ group.owner.displayName }}</dd>
      </div>
    </dl>

    <GroupModuleBadges :modules="moduleLabels" />
  </AppCard>
</template>

<style scoped>
.group-card {
  height: 100%;
}

.group-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.group-card__copy {
  display: grid;
  gap: 0.65rem;
}

.group-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.group-card__code,
.group-card__badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.68rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.group-card__code {
  border: 1px solid var(--color-border);
  background: var(--color-panel-muted);
  color: var(--color-subtle);
}

.group-card__badge {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.group-card__badge--archived {
  background: rgba(20, 32, 51, 0.08);
  color: var(--color-text);
}

.group-card__badge--deleted {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.group-card__title {
  font-size: 1.3rem;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.group-card__description {
  color: var(--color-subtle);
}

.group-card__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.group-card__facts div {
  display: grid;
  gap: 0.28rem;
}

.group-card__facts dt {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.group-card__facts dd {
  margin: 0;
  font-weight: 700;
}

@media (max-width: 720px) {
  .group-card__header {
    flex-direction: column;
  }

  .group-card__facts {
    grid-template-columns: 1fr;
  }
}
</style>
