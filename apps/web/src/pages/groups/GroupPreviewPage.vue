<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import GroupModuleBadges from '../../features/groups/components/GroupModuleBadges.vue'
import {
  getGroupsErrorMessage,
  isAlreadyGroupMemberError,
  isPendingJoinRequestError,
} from '../../features/groups/api/groups.api'
import {
  useCreateJoinRequestMutation,
  useGroup,
  useJoinGroupMutation,
} from '../../features/groups/composables/useGroups'
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
const joinGroupMutation = useJoinGroupMutation()
const createJoinRequestMutation = useCreateJoinRequestMutation()
const actionError = ref('')

const group = computed(() => groupQuery.data.value ?? null)
const moduleLabels = computed(() => (group.value ? getEnabledGroupModules(group.value.settings) : []))
const shouldRedirectToWorkspace = computed(() => Boolean(group.value?.viewerMembershipRole))
const hasPendingJoinRequest = computed(() => group.value?.viewerJoinRequestStatus === 'PENDING')
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
  const error = groupQuery.error.value

  return error ? getGroupsErrorMessage(error, 'Не удалось открыть карточку группы') : ''
})
const isPrimaryActionPending = computed(
  () => joinGroupMutation.isPending.value || createJoinRequestMutation.isPending.value,
)
const primaryActionLabel = computed(() => {
  if (!group.value) {
    return 'Открываем группу'
  }

  if (shouldRedirectToWorkspace.value) {
    return 'Перейти в workspace'
  }

  if (group.value.accessMode === 'OPEN') {
    return joinGroupMutation.isPending.value ? 'Вступаем...' : 'Вступить'
  }

  if (group.value.accessMode === 'BY_REQUEST') {
    if (hasPendingJoinRequest.value) {
      return 'Заявка отправлена'
    }

    return createJoinRequestMutation.isPending.value ? 'Отправляем заявку...' : 'Подать заявку'
  }

  return 'Доступ закрыт'
})
const hasPrimaryAction = computed(() => {
  if (!group.value) {
    return false
  }

  return shouldRedirectToWorkspace.value || group.value.accessMode !== 'CLOSED'
})
const isPrimaryActionDisabled = computed(
  () => !hasPrimaryAction.value || isPrimaryActionPending.value || hasPendingJoinRequest.value,
)
const accessPanelTitle = computed(() => {
  if (!group.value) {
    return 'Контекст доступа'
  }

  if (shouldRedirectToWorkspace.value) {
    return 'Вы уже состоите в группе'
  }

  if (group.value.accessMode === 'OPEN') {
    return 'Можно вступить сразу'
  }

  if (group.value.accessMode === 'BY_REQUEST') {
    return hasPendingJoinRequest.value ? 'Заявка уже зафиксирована' : 'Нужна заявка на вступление'
  }

  return 'Доступ ограничен'
})
const accessPanelLead = computed(() => {
  if (!group.value) {
    return ''
  }

  if (shouldRedirectToWorkspace.value) {
    return 'Этот экран служит только точкой входа. Для участников он сразу переводит в рабочую область группы.'
  }

  if (group.value.accessMode === 'OPEN') {
    return 'После вступления вы сразу попадёте во внутренний workspace группы и увидите доступные модули.'
  }

  if (group.value.accessMode === 'BY_REQUEST') {
    return hasPendingJoinRequest.value
      ? 'Заявка уже отправлена. Теперь решение зависит от владельца или администратора группы.'
      : 'Владелец или администратор увидит заявку и сможет одобрить или отклонить доступ.'
  }

  return 'Текущий backend не открывает отдельный outsider-flow для закрытых групп.'
})

watch(
  groupId,
  () => {
    actionError.value = ''
  },
)

watch(
  shouldRedirectToWorkspace,
  async (nextValue) => {
    if (!nextValue) {
      return
    }

    await router.replace({
      name: 'group-overview',
      params: {
        groupId: groupId.value,
      },
    })
  },
  {
    immediate: true,
  },
)

async function handlePrimaryAction() {
  if (!group.value || isPrimaryActionDisabled.value) {
    return
  }

  actionError.value = ''

  if (shouldRedirectToWorkspace.value) {
    await router.replace({
      name: 'group-overview',
      params: {
        groupId: groupId.value,
      },
    })
    return
  }

  if (group.value.accessMode === 'OPEN') {
    await handleJoin()
    return
  }

  if (group.value.accessMode === 'BY_REQUEST') {
    await handleCreateJoinRequest()
  }
}

async function handleJoin() {
  try {
    await joinGroupMutation.mutateAsync(groupId.value)
    await router.replace({
      name: 'group-overview',
      params: {
        groupId: groupId.value,
      },
    })
  } catch (error) {
    if (isAlreadyGroupMemberError(error)) {
      await groupQuery.refetch()
      await router.replace({
        name: 'group-overview',
        params: {
          groupId: groupId.value,
        },
      })
      return
    }

    actionError.value = getGroupsErrorMessage(error, 'Не удалось вступить в группу')
  }
}

async function handleCreateJoinRequest() {
  try {
    await createJoinRequestMutation.mutateAsync(groupId.value)
    await groupQuery.refetch()
  } catch (error) {
    if (isAlreadyGroupMemberError(error)) {
      await groupQuery.refetch()
      await router.replace({
        name: 'group-overview',
        params: {
          groupId: groupId.value,
        },
      })
      return
    }

    if (isPendingJoinRequestError(error)) {
      await groupQuery.refetch()
      return
    }

    actionError.value = getGroupsErrorMessage(error, 'Не удалось отправить заявку на вступление')
  }
}
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Group Preview</span>
      <h1 class="page-title">{{ group?.name ?? 'Открываем группу' }}</h1>
      <p class="page-lead">{{ pageLead }}</p>
    </header>

    <AppLoader
      v-if="groupQuery.isPending.value"
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
        <h2 class="side-title">{{ accessPanelTitle }}</h2>
        <p class="muted">{{ accessPanelLead }}</p>

        <div class="panel-note">
          {{ groupAccessModeDescriptions[group.accessMode] }}
        </div>

        <div v-if="hasPendingJoinRequest" class="preview-feedback preview-feedback--success">
          Заявка отправлена. Пока она в ожидании, повторное действие на этом экране не требуется.
        </div>

        <div v-if="actionError" class="preview-feedback preview-feedback--error">
          {{ actionError }}
        </div>

        <div class="page-actions">
          <AppButton
            v-if="hasPrimaryAction"
            type="button"
            :disabled="isPrimaryActionDisabled"
            @click="handlePrimaryAction"
          >
            {{ primaryActionLabel }}
          </AppButton>
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

.preview-feedback {
  padding: 0.85rem 0.95rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.preview-feedback--success {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.preview-feedback--error {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

@media (max-width: 720px) {
  .preview-card__facts {
    grid-template-columns: 1fr;
  }
}
</style>
