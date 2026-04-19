<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuth } from '../../features/auth/composables/useAuth'
import { getGroupsErrorMessage, type GroupMember } from '../../features/groups/api/groups.api'
import {
  useGroupMembers,
  useLeaveGroupMutation,
  useRemoveGroupMemberMutation,
  useUpdateGroupMemberRoleMutation,
} from '../../features/groups/composables/useGroups'
import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import { groupMembershipRoleLabels } from '../../features/groups/lib/groups.ui'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'
import UserDirectChatButton from '../../features/chats/components/UserDirectChatButton.vue'

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuth()

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const membersQuery = useGroupMembers(groupId, {
  enabled: workspace.isMember,
})
const updateMemberRoleMutation = useUpdateGroupMemberRoleMutation(groupId)
const removeMemberMutation = useRemoveGroupMemberMutation(groupId)
const leaveGroupMutation = useLeaveGroupMutation(groupId)

const roleDrafts = reactive<Record<string, GroupMember['role']>>({})
const transferTargetUserId = ref('')
const actionError = ref('')
const busyActionKey = ref('')

const group = computed(() => workspace.group.value)
const members = computed(() => membersQuery.data.value ?? [])
const memberCount = computed(() => members.value.length)
const managerCount = computed(() => members.value.filter((member) => member.role !== 'USER').length)
const currentUserId = computed(() => currentUser.value?.id ?? '')
const currentMember = computed(() => members.value.find((member) => member.userId === currentUserId.value) ?? null)
const membersErrorMessage = computed(() => {
  const error = membersQuery.error.value

  return error ? getGroupsErrorMessage(error, 'Не удалось загрузить состав группы') : ''
})
const canShowManagerActions = computed(() => workspace.canManageGroup.value && !workspace.isReadOnly.value)
const transferCandidates = computed(() =>
  members.value.filter((member) => member.userId !== group.value?.ownerId),
)
const canLeaveGroup = computed(
  () =>
    !workspace.isReadOnly.value &&
    (workspace.membershipRole.value === 'USER' || workspace.membershipRole.value === 'ADMIN'),
)
const isActionPending = computed(
  () =>
    updateMemberRoleMutation.isPending.value ||
    removeMemberMutation.isPending.value ||
    leaveGroupMutation.isPending.value,
)

watch(
  members,
  (nextMembers) => {
    const nextUserIds = new Set(nextMembers.map((member) => member.userId))

    for (const member of nextMembers) {
      roleDrafts[member.userId] = member.role
    }

    for (const userId of Object.keys(roleDrafts)) {
      if (!nextUserIds.has(userId)) {
        delete roleDrafts[userId]
      }
    }

    if (!transferCandidates.value.some((member) => member.userId === transferTargetUserId.value)) {
      transferTargetUserId.value = transferCandidates.value[0]?.userId ?? ''
    }
  },
  {
    immediate: true,
  },
)

function canManageMember(member: GroupMember) {
  return canShowManagerActions.value && member.userId !== currentUserId.value && member.userId !== group.value?.ownerId
}

function isRoleDirty(member: GroupMember) {
  return (roleDrafts[member.userId] ?? member.role) !== member.role
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('')
}

function formatJoinedAt(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
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

function resetActionState() {
  actionError.value = ''
}

async function handleRoleSave(member: GroupMember) {
  if (!canManageMember(member) || !isRoleDirty(member)) {
    return
  }

  busyActionKey.value = `role:${member.userId}`
  resetActionState()

  try {
    await updateMemberRoleMutation.mutateAsync({
      userId: member.userId,
      role: roleDrafts[member.userId] ?? member.role,
    })
  } catch (error) {
    actionError.value = getGroupsErrorMessage(error, 'Не удалось обновить роль участника')
  } finally {
    busyActionKey.value = ''
  }
}

async function handleTransferOwnership() {
  const targetMember = transferCandidates.value.find((member) => member.userId === transferTargetUserId.value)

  if (!workspace.isOwner.value || workspace.isReadOnly.value || !targetMember) {
    return
  }

  const shouldProceed = window.confirm(
    `Передать владение группой "${group.value?.name ?? 'этой группой'}" пользователю ${
      targetMember.user.displayName
    }? После этого вы останетесь в группе как администратор.`,
  )

  if (!shouldProceed) {
    return
  }

  busyActionKey.value = 'transfer'
  resetActionState()

  try {
    await updateMemberRoleMutation.mutateAsync({
      userId: targetMember.userId,
      role: 'OWNER',
    })
  } catch (error) {
    actionError.value = getGroupsErrorMessage(error, 'Не удалось передать владение группой')
  } finally {
    busyActionKey.value = ''
  }
}

async function handleRemoveMember(member: GroupMember) {
  if (!canManageMember(member)) {
    return
  }

  const shouldProceed = window.confirm(
    `Удалить ${member.user.displayName} из группы "${group.value?.name ?? 'этой группы'}"? Участник потеряет доступ ко всем модулям workspace.`,
  )

  if (!shouldProceed) {
    return
  }

  busyActionKey.value = `remove:${member.userId}`
  resetActionState()

  try {
    await removeMemberMutation.mutateAsync(member.userId)
  } catch (error) {
    actionError.value = getGroupsErrorMessage(error, 'Не удалось удалить участника из группы')
  } finally {
    busyActionKey.value = ''
  }
}

async function handleLeaveGroup() {
  if (!canLeaveGroup.value) {
    return
  }

  const shouldProceed = window.confirm(
    `Покинуть группу "${group.value?.name ?? 'эту группу'}"? После выхода доступ к workspace будет сразу закрыт.`,
  )

  if (!shouldProceed) {
    return
  }

  busyActionKey.value = 'leave'
  resetActionState()

  try {
    await leaveGroupMutation.mutateAsync()
    await router.push({
      name: 'groups',
    })
  } catch (error) {
    actionError.value = getGroupsErrorMessage(error, 'Не удалось покинуть группу')
  } finally {
    busyActionKey.value = ''
  }
}
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Workspace / Members</span>
      <h1 class="page-title">Состав группы, роли и сценарии владения управляются в одном рабочем контуре.</h1>
      <p class="page-lead">
        Все участники видят полный список состава. Владелец и администраторы получают отдельные действия для ролей,
        удаления и передачи владения без выхода из group workspace.
      </p>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа находится в архиве. Состав и роли остаются видимыми, но все редактирующие действия и выход из группы
      отключены до восстановления.
    </div>

    <AppLoader v-if="membersQuery.isPending.value" label="Загружаем состав группы и роли участников" />

    <AppErrorState
      v-else-if="membersErrorMessage"
      title="Не удалось загрузить участников"
      :description="membersErrorMessage"
    />

    <AppEmptyState
      v-else-if="members.length === 0"
      title="В группе пока нет участников"
      description="Когда backend вернёт состав группы, здесь появятся участники, роли и доступные management actions."
    />

    <div v-else class="section-grid">
      <AppCard class="span-8 members-card">
        <div class="members-card__header">
          <div>
            <h2 class="members-card__title">Состав группы</h2>
            <p class="muted">Роль владельца и управляющие роли фиксируются прямо в списке без перехода в отдельный экран.</p>
          </div>

          <div class="pill-list">
            <span class="pill">{{ memberCount }} участников</span>
            <span class="pill">{{ managerCount }} менеджеров</span>
          </div>
        </div>

        <AppErrorState
          v-if="actionError"
          title="Не удалось выполнить действие"
          :description="actionError"
        />

        <ul class="member-list">
          <li v-for="member in members" :key="member.userId" class="member-item">
            <div class="member-item__identity">
              <img
                v-if="getAvatarUrl(member.user.avatarUrl)"
                :src="getAvatarUrl(member.user.avatarUrl)"
                :alt="member.user.displayName"
                class="member-item__avatar member-item__avatar--image"
              />
              <div v-else class="member-item__avatar">
                {{ getInitials(member.user.displayName) }}
              </div>

              <div class="member-item__copy">
                <div class="member-item__headline">
                  <strong>{{ member.user.displayName }}</strong>
                  <span class="pill">{{ groupMembershipRoleLabels[member.role] }}</span>
                  <span v-if="member.userId === currentUserId" class="pill">Вы</span>
                </div>

                <p v-if="normalizeOptionalText(member.user.bio)" class="member-item__bio">
                  {{ normalizeOptionalText(member.user.bio) }}
                </p>
                <p v-else class="member-item__bio member-item__bio--muted">
                  Публичное bio не заполнено.
                </p>

                <p class="member-item__meta">В группе с {{ formatJoinedAt(member.joinedAt) }}</p>

                <div v-if="member.userId !== currentUserId" class="member-item__context-actions">
                  <AppButton
                    variant="ghost"
                    size="sm"
                    :to="{
                      name: 'public-user-profile',
                      params: {
                        userId: member.userId,
                      },
                    }"
                  >
                    Профиль
                  </AppButton>
                  <UserDirectChatButton :user-id="member.userId" />
                </div>
              </div>
            </div>

            <div v-if="canManageMember(member)" class="member-item__actions">
              <label class="member-item__field">
                <span class="member-item__field-label">Роль</span>
                <select
                  v-model="roleDrafts[member.userId]"
                  class="member-item__select"
                  :disabled="isActionPending"
                >
                  <option value="ADMIN">Администратор</option>
                  <option value="USER">Участник</option>
                </select>
              </label>

              <div class="member-item__buttons">
                <AppButton
                  variant="secondary"
                  size="sm"
                  :disabled="!isRoleDirty(member) || isActionPending"
                  @click="handleRoleSave(member)"
                >
                  {{ busyActionKey === `role:${member.userId}` ? 'Сохраняем...' : 'Сохранить роль' }}
                </AppButton>

                <AppButton
                  variant="ghost"
                  size="sm"
                  :disabled="isActionPending"
                  @click="handleRemoveMember(member)"
                >
                  {{ busyActionKey === `remove:${member.userId}` ? 'Удаляем...' : 'Удалить из группы' }}
                </AppButton>
              </div>
            </div>
          </li>
        </ul>
      </AppCard>

      <AppCard class="span-4 side-card" tone="accent">
        <span class="page-eyebrow">Моё участие</span>
        <h2 class="side-card__title">{{ currentMember ? groupMembershipRoleLabels[currentMember.role] : 'Участник группы' }}</h2>
        <p class="muted">
          {{ currentMember?.userId === group?.ownerId
            ? 'Владелец не может выйти из группы напрямую: сначала нужно явно передать ownership другому участнику.'
            : 'Выход из группы вынесен отдельно, чтобы не путать его с админским удалением участников.' }}
        </p>

        <div class="pill-list">
          <span v-if="currentMember" class="pill">{{ groupMembershipRoleLabels[currentMember.role] }}</span>
          <span v-if="group" class="pill">{{ group.name }}</span>
        </div>

        <div class="side-card__actions">
          <AppButton
            v-if="canLeaveGroup"
            variant="secondary"
            block
            :disabled="isActionPending"
            @click="handleLeaveGroup"
          >
            {{ busyActionKey === 'leave' ? 'Выходим...' : 'Покинуть группу' }}
          </AppButton>

          <AppButton v-else-if="workspace.isOwner.value" href="#ownership-transfer" variant="secondary" block>
            Перейти к передаче владения
          </AppButton>
        </div>
      </AppCard>

      <AppCard
        v-if="workspace.isOwner.value"
        id="ownership-transfer"
        class="span-4 side-card"
      >
        <span class="page-eyebrow">Ownership</span>
        <h2 class="side-card__title">Передача владения</h2>
        <p class="muted">
          Это отдельный явный flow: выбранный участник становится владельцем, а текущий owner автоматически остаётся
          в группе как администратор.
        </p>

        <template v-if="transferCandidates.length > 0">
          <label class="member-item__field">
            <span class="member-item__field-label">Новый владелец</span>
            <select
              v-model="transferTargetUserId"
              class="member-item__select"
              :disabled="workspace.isReadOnly.value || isActionPending"
            >
              <option v-for="member in transferCandidates" :key="member.userId" :value="member.userId">
                {{ member.user.displayName }}
              </option>
            </select>
          </label>

          <AppButton
            block
            :disabled="workspace.isReadOnly.value || !transferTargetUserId || isActionPending"
            @click="handleTransferOwnership"
          >
            {{ busyActionKey === 'transfer' ? 'Передаём владение...' : 'Передать владение' }}
          </AppButton>
        </template>

        <AppEmptyState
          v-else
          title="Некому передавать ownership"
          description="Для передачи владения в группе должен быть хотя бы ещё один участник."
        />
      </AppCard>

      <AppCard class="span-8 side-card">
        <span class="page-eyebrow">Права доступа</span>
        <h2 class="side-card__title">Что учитывает экран участников</h2>
        <ul class="list-copy">
          <li>обычные участники видят состав группы, но не получают destructive и role-management действий</li>
          <li>администраторы и владелец управляют ролями и удалением только вне archived/read-only режима</li>
          <li>ownership не скрыт внутри обычного выбора роли и вынесен в отдельный подтверждаемый сценарий</li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.members-card,
.side-card {
  gap: 1.2rem;
}

.members-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.members-card__title,
.side-card__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.member-list {
  display: grid;
  gap: 0.9rem;
}

.member-item {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.66);
}

.member-item__identity {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.member-item__avatar {
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

.member-item__avatar--image {
  object-fit: cover;
  background: var(--color-panel-muted);
}

.member-item__copy {
  display: grid;
  gap: 0.45rem;
}

.member-item__headline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.member-item__bio {
  color: var(--color-text);
}

.member-item__bio--muted,
.member-item__meta {
  color: var(--color-subtle);
}

.member-item__context-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.member-item__actions {
  display: grid;
  gap: 0.85rem;
  padding-top: 0.2rem;
  border-top: 1px solid rgba(31, 117, 156, 0.12);
}

.member-item__field {
  display: grid;
  gap: 0.4rem;
}

.member-item__field-label {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.member-item__select {
  min-height: 2.8rem;
  padding: 0.72rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-panel);
  color: var(--color-text);
}

.member-item__buttons,
.side-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (max-width: 900px) {
  .members-card__header,
  .member-item__identity {
    flex-direction: column;
  }
}
</style>
