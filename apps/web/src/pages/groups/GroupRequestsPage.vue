<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { getGroupsErrorMessage, type GroupJoinRequest } from '../../features/groups/api/groups.api'
import {
  useDecideJoinRequestMutation,
  useGroupJoinRequests,
} from '../../features/groups/composables/useGroups'
import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import { groupJoinRequestStatusLabels } from '../../features/groups/lib/groups.ui'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const requestsQuery = useGroupJoinRequests(groupId, {}, {
  enabled: workspace.canManageGroup,
})
const decideJoinRequestMutation = useDecideJoinRequestMutation(groupId)

const actionError = ref('')
const busyActionKey = ref('')

const requests = computed(() => requestsQuery.data.value ?? [])
const pendingRequests = computed(() =>
  [...requests.value]
    .filter((request) => request.status === 'PENDING')
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
)
const processedRequests = computed(() =>
  [...requests.value]
    .filter((request) => request.status !== 'PENDING')
    .sort((left, right) => {
      const rightDate = getReviewedAt(right) ?? right.updatedAt
      const leftDate = getReviewedAt(left) ?? left.updatedAt

      return new Date(rightDate).getTime() - new Date(leftDate).getTime()
    }),
)
const requestsErrorMessage = computed(() => {
  const error = requestsQuery.error.value

  return error ? getGroupsErrorMessage(error, 'Не удалось загрузить заявки на вступление') : ''
})
const approvedCount = computed(() => requests.value.filter((request) => request.status === 'APPROVED').length)
const rejectedCount = computed(() => requests.value.filter((request) => request.status === 'REJECTED').length)
const isDecisionPending = computed(() => decideJoinRequestMutation.isPending.value)

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('')
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function getAvatarUrl(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function getReviewedAt(request: GroupJoinRequest) {
  return typeof request.reviewedAt === 'string' ? request.reviewedAt : null
}

async function handleDecision(request: GroupJoinRequest, decision: 'APPROVED' | 'REJECTED') {
  if (workspace.isReadOnly.value || request.status !== 'PENDING') {
    return
  }

  const shouldProceed =
    decision === 'REJECTED'
      ? window.confirm(`Отклонить заявку от ${request.user.displayName}? Пользователь останется вне группы.`)
      : true

  if (!shouldProceed) {
    return
  }

  busyActionKey.value = `${decision}:${request.id}`
  actionError.value = ''

  try {
    await decideJoinRequestMutation.mutateAsync({
      requestId: request.id,
      decision,
    })
  } catch (error) {
    actionError.value = getGroupsErrorMessage(error, 'Не удалось обработать заявку')
  } finally {
    busyActionKey.value = ''
  }
}
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Workspace / Requests</span>
      <h1 class="page-title">Join requests остаются отдельным owner/admin потоком и не смешиваются с общим составом группы.</h1>
      <p class="page-lead">
        Экран показывает pending и уже обработанные заявки в группах c режимом доступа `BY_REQUEST`. После решения
        список обновляется в том же workspace-контексте.
      </p>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа в архиве, поэтому заявки доступны только для просмотра. Решения approve/reject временно заблокированы.
    </div>

    <AppLoader v-if="requestsQuery.isPending.value" label="Собираем заявки на вступление" />

    <AppErrorState
      v-else-if="requestsErrorMessage"
      title="Не удалось загрузить заявки"
      :description="requestsErrorMessage"
    />

    <AppEmptyState
      v-else-if="requests.length === 0"
      title="Заявок пока нет"
      description="Когда пользователи подадут заявки на вступление, здесь появится pending и processed история."
    />

    <div v-else class="section-grid">
      <AppCard class="span-4 metrics-card" tone="accent">
        <span class="page-eyebrow">Сводка</span>
        <div class="metric-grid metrics-card__grid">
          <div class="metric">
            <span class="metric__value">{{ pendingRequests.length }}</span>
            <span class="metric__label">Ожидают решения</span>
          </div>
          <div class="metric">
            <span class="metric__value">{{ approvedCount }}</span>
            <span class="metric__label">Одобрено</span>
          </div>
          <div class="metric">
            <span class="metric__value">{{ rejectedCount }}</span>
            <span class="metric__label">Отклонено</span>
          </div>
        </div>

        <p class="muted">
          Пункт `Заявки` виден только owner/admin и только в группах с режимом доступа `BY_REQUEST`, поэтому он не
          торчит в боковой навигации для остальных сценариев.
        </p>
      </AppCard>

      <AppCard class="span-8 requests-card">
        <div class="requests-card__header">
          <div>
            <h2 class="requests-card__title">Ожидают решения</h2>
            <p class="muted">Новые заявки рассматриваются прямо в списке без переключения на отдельный moderation flow.</p>
          </div>

          <span class="pill">{{ pendingRequests.length }} pending</span>
        </div>

        <AppErrorState
          v-if="actionError"
          title="Не удалось выполнить решение по заявке"
          :description="actionError"
        />

        <AppEmptyState
          v-if="pendingRequests.length === 0"
          title="Pending-заявок нет"
          description="Все текущие запросы уже обработаны, новых участников сейчас никто не ожидает."
        />

        <ul v-else class="request-list">
          <li v-for="request in pendingRequests" :key="request.id" class="request-item">
            <div class="request-item__identity">
              <img
                v-if="getAvatarUrl(request.user.avatarUrl)"
                :src="getAvatarUrl(request.user.avatarUrl)"
                :alt="request.user.displayName"
                class="request-item__avatar request-item__avatar--image"
              />
              <div v-else class="request-item__avatar">
                {{ getInitials(request.user.displayName) }}
              </div>

              <div class="request-item__copy">
                <div class="request-item__headline">
                  <strong>{{ request.user.displayName }}</strong>
                  <span class="pill">{{ groupJoinRequestStatusLabels[request.status] }}</span>
                </div>
                <p v-if="normalizeOptionalText(request.user.bio)" class="request-item__bio">
                  {{ normalizeOptionalText(request.user.bio) }}
                </p>
                <p v-else class="request-item__bio request-item__bio--muted">Публичное bio не заполнено.</p>
                <p class="request-item__meta">Подана {{ formatDateTime(request.createdAt) }}</p>
              </div>
            </div>

            <div class="request-item__actions">
              <AppButton
                size="sm"
                :disabled="workspace.isReadOnly.value || isDecisionPending"
                @click="handleDecision(request, 'APPROVED')"
              >
                {{ busyActionKey === `APPROVED:${request.id}` ? 'Одобряем...' : 'Одобрить' }}
              </AppButton>

              <AppButton
                variant="ghost"
                size="sm"
                :disabled="workspace.isReadOnly.value || isDecisionPending"
                @click="handleDecision(request, 'REJECTED')"
              >
                {{ busyActionKey === `REJECTED:${request.id}` ? 'Отклоняем...' : 'Отклонить' }}
              </AppButton>
            </div>
          </li>
        </ul>
      </AppCard>

      <AppCard class="span-12 requests-card">
        <div class="requests-card__header">
          <div>
            <h2 class="requests-card__title">История решений</h2>
            <p class="muted">Processed-заявки остаются видимыми, чтобы owner/admin видел прошлые approve/reject решения.</p>
          </div>

          <span class="pill">{{ processedRequests.length }} processed</span>
        </div>

        <AppEmptyState
          v-if="processedRequests.length === 0"
          title="Решений пока нет"
          description="История начнёт заполняться после первых approve или reject действий."
        />

        <ul v-else class="request-list request-list--processed">
          <li v-for="request in processedRequests" :key="request.id" class="request-item">
            <div class="request-item__identity">
              <img
                v-if="getAvatarUrl(request.user.avatarUrl)"
                :src="getAvatarUrl(request.user.avatarUrl)"
                :alt="request.user.displayName"
                class="request-item__avatar request-item__avatar--image"
              />
              <div v-else class="request-item__avatar">
                {{ getInitials(request.user.displayName) }}
              </div>

              <div class="request-item__copy">
                <div class="request-item__headline">
                  <strong>{{ request.user.displayName }}</strong>
                  <span class="pill">{{ groupJoinRequestStatusLabels[request.status] }}</span>
                </div>
                <p class="request-item__meta">Подана {{ formatDateTime(request.createdAt) }}</p>
                <p class="request-item__meta">
                  Решение:
                  {{ request.reviewer?.displayName ?? 'Неизвестный менеджер' }},
                  {{ formatDateTime(getReviewedAt(request) ?? request.updatedAt) }}
                </p>
              </div>
            </div>
          </li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.metrics-card,
.requests-card {
  gap: 1.2rem;
}

.metrics-card__grid {
  grid-template-columns: 1fr;
}

.requests-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.requests-card__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.request-list {
  display: grid;
  gap: 0.9rem;
}

.request-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.66);
}

.request-item__identity {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  min-width: 0;
}

.request-item__avatar {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  font-weight: 800;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.request-item__avatar--image {
  object-fit: cover;
  background: var(--color-panel-muted);
}

.request-item__copy {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.request-item__headline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.request-item__bio--muted,
.request-item__meta {
  color: var(--color-subtle);
}

.request-item__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

@media (max-width: 900px) {
  .request-item,
  .request-item__identity,
  .requests-card__header {
    flex-direction: column;
  }
}
</style>
