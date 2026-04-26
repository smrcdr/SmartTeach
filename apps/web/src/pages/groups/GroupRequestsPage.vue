<script setup lang="ts">
import { computed } from 'vue'
import { listJoinRequests } from '@/features/groups/api/groups.api'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

const { items: requests } = useGroupRouteList(listJoinRequests)
const pendingRequests = computed(() => requests.value.filter((request) => request.status === 'PENDING'))
</script>

<template>
  <main class="page">
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
        </template>
      </WorkspaceItem>
      <EmptyState v-if="pendingRequests.length === 0" title="Заявок пока нет" />
    </ContentList>
  </main>
</template>
