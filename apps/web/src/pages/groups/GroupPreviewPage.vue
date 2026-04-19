<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import GroupModuleBadges from '../../features/groups/components/GroupModuleBadges.vue'
import { getGroupsErrorMessage } from '../../features/groups/api/groups.api'
import { useGroup, useGroupsList } from '../../features/groups/composables/useGroups'
import {
  formatMembersCount,
  getEnabledGroupModules,
  groupAccessModeDescriptions,
  groupAccessModeLabels,
} from '../../features/groups/lib/groups.ui'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const groupQuery = useGroup(groupId)
const joinedGroupsQuery = useGroupsList('joined')

const group = computed(() => groupQuery.data.value ?? null)
const joinedGroupIds = computed(() => new Set((joinedGroupsQuery.data.value ?? []).map((entry) => entry.id)))
const moduleLabels = computed(() => (group.value ? getEnabledGroupModules(group.value.settings) : []))
const shouldRedirectToWorkspace = computed(() => Boolean(group.value) && joinedGroupIds.value.has(groupId.value))
const pageLead = computed(() => {
  if (!group.value) {
    return ''
  }

  if (group.value.accessMode === 'OPEN') {
    return 'Группа доступна по открытому доступу и уже видна вам как потенциальному участнику.'
  }

  if (group.value.accessMode === 'BY_REQUEST') {
    return 'Для этой группы нужен подтверждённый доступ, поэтому сначала можно посмотреть контекст и правила входа.'
  }

  return 'Группа доступна только по прямому приглашению владельца или администратора.'
})
const errorMessage = computed(() => {
  const error = groupQuery.error.value ?? joinedGroupsQuery.error.value

  return error ? getGroupsErrorMessage(error, 'Не удалось открыть карточку группы') : ''
})

watch(
  shouldRedirectToWorkspace,
  async (nextValue) => {
    if (!nextValue) {
      return
    }

    await router.replace(`/groups/${groupId.value}/overview`)
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Group Preview</span>
      <h1 class="page-title">{{ group?.name ?? 'Открываем группу' }}</h1>
      <p class="page-lead">{{ pageLead }}</p>
    </header>

    <AppLoader
      v-if="groupQuery.isPending.value || joinedGroupsQuery.isPending.value"
      label="Проверяем доступность группы и ваш контекст"
    />

    <AppErrorState
      v-else-if="errorMessage"
      title="Не удалось открыть группу"
      :description="errorMessage"
    >
      <template #actions>
        <AppButton to="/groups" variant="secondary">К группам</AppButton>
        <AppButton to="/groups/join" variant="ghost">Ввести другой код</AppButton>
      </template>
    </AppErrorState>

    <div v-else-if="group" class="section-grid">
      <AppCard class="span-8 preview-card">
        <div class="preview-card__meta">
          <span class="preview-card__code">{{ group.code }}</span>
          <span class="preview-card__badge">{{ groupAccessModeLabels[group.accessMode] }}</span>
        </div>

        <p class="preview-card__description">
          {{ group.description ?? 'Описание пока не заполнено, но группа уже доступна по коду и в публичном каталоге.' }}
        </p>

        <dl class="preview-card__facts">
          <div>
            <dt>Владелец</dt>
            <dd>{{ group.owner.displayName }}</dd>
          </div>
          <div>
            <dt>Участники</dt>
            <dd>{{ formatMembersCount(group.membersCount) }}</dd>
          </div>
          <div>
            <dt>Доступ</dt>
            <dd>{{ groupAccessModeLabels[group.accessMode] }}</dd>
          </div>
        </dl>

        <div class="preview-card__section">
          <strong>Включённые модули</strong>
          <GroupModuleBadges :modules="moduleLabels" />
        </div>
      </AppCard>

      <AppCard class="span-4" tone="accent">
        <span class="page-eyebrow">Контекст доступа</span>
        <h2 class="side-title">Карточка группы уже отделена от полноценного workspace.</h2>
        <p class="muted">{{ groupAccessModeDescriptions[group.accessMode] }}</p>

        <div class="panel-note">
          Если группа уже ваша, этот маршрут автоматически переведёт вас в workspace без дополнительного выбора.
        </div>

        <div class="page-actions">
          <AppButton to="/groups" variant="secondary">К каталогу</AppButton>
          <AppButton to="/groups/join" variant="ghost">Ввести другой код</AppButton>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.preview-card {
  gap: 1.25rem;
}

.preview-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.preview-card__code,
.preview-card__badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.68rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 800;
}

.preview-card__code {
  border: 1px solid var(--color-border);
  background: var(--color-panel-muted);
  color: var(--color-subtle);
}

.preview-card__badge {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.preview-card__description {
  color: var(--color-subtle);
}

.preview-card__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.preview-card__facts div {
  display: grid;
  gap: 0.28rem;
}

.preview-card__facts dt {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.preview-card__facts dd {
  margin: 0;
  font-weight: 700;
}

.preview-card__section {
  display: grid;
  gap: 0.75rem;
}

.side-title {
  font-size: 1.15rem;
  line-height: 1.12;
  letter-spacing: -0.03em;
}

@media (max-width: 720px) {
  .preview-card__facts {
    grid-template-columns: 1fr;
  }
}
</style>
