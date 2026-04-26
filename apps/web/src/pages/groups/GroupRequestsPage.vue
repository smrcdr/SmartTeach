<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { decideJoinRequest, listJoinRequests } from '@/features/groups/api/groups.api'
import type { GroupJoinRequest } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

const auth = useAuthStore()
const notifications = useNotificationStore()
const { group, error: groupError, isLoading: isGroupLoading } = useGroup()
const { items: requests, groupId, error: requestsError, refresh } = useGroupRouteList(listJoinRequests)
const pendingRequests = computed(() => requests.value.filter((request) => request.status === 'PENDING'))
const canManage = computed(() => canManageGroup(group.value))
const activeRequestId = ref<string | null>(null)

async function decide(request: GroupJoinRequest, decision: 'APPROVED' | 'REJECTED') {
  if (!auth.accessToken || activeRequestId.value) {
    return
  }

  activeRequestId.value = request.id
  try {
    await decideJoinRequest(groupId.value, request.id, decision, auth.accessToken)
    notifications.success(decision === 'APPROVED' ? 'Заявка одобрена' : 'Заявка отклонена')
    await refresh()
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось обработать заявку')
  } finally {
    activeRequestId.value = null
  }
}
</script>

<template>
  <main v-if="canManage" class="page">
    <AppPageHeader eyebrow="Доступ" title="Заявки на вступление" description="Рассматривайте входящие заявки и управляйте доступом к закрытым группам." />
    <ContentList title="Ожидают решения">
      <WorkspaceItem
        v-for="request in pendingRequests"
        :key="request.id"
        :title="request.user.displayName"
        :description="request.user.bio ?? 'Пользователь отправил заявку на вступление.'"
        :meta="formatDateTime(request.createdAt)"
      >
        <template #aside>
          <StatusPill label="Pending" tone="warning" />
          <AppButton
            size="sm"
            :disabled="activeRequestId === request.id"
            @click="decide(request, 'APPROVED')"
          >
            Принять
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="activeRequestId === request.id"
            @click="decide(request, 'REJECTED')"
          >
            Отклонить
          </AppButton>
        </template>
      </WorkspaceItem>
      <EmptyState v-if="pendingRequests.length === 0" title="Заявок пока нет" />
      <EmptyState v-if="requestsError" title="Не удалось загрузить заявки" :description="requestsError" />
    </ContentList>
  </main>
  <main v-else class="page">
    <EmptyState
      :title="isGroupLoading ? 'Загружаем группу' : 'Недостаточно прав'"
      :description="isGroupLoading ? 'Проверяем ваши права доступа.' : groupError ?? 'Заявки доступны владельцу и администраторам группы.'"
    />
  </main>
</template>
