<script setup lang="ts">
import GroupHeroPanel from '@/features/groups/components/GroupHeroPanel.vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { createJoinRequest, joinGroup } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import EmptyState from '@/shared/ui/EmptyState.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const route = useRoute()
const router = useRouter()
const isJoining = ref(false)
const { group, error, refresh } = useGroup()

async function submitAccessRequest() {
  if (!group.value) {
    return
  }

  if (!auth.accessToken) {
    await router.push({
      name: 'login',
      query: {
        redirect: route.fullPath
      }
    })
    return
  }

  isJoining.value = true
  try {
    if (group.value.accessMode === 'OPEN') {
      await joinGroup(group.value.id, auth.accessToken)
      notifications.success('Вы вступили в группу')
    } else {
      await createJoinRequest(group.value.id, auth.accessToken)
      notifications.success('Заявка отправлена')
    }

    await refresh()
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось вступить в группу')
  } finally {
    isJoining.value = false
  }
}
</script>

<template>
  <main class="page group-preview">
    <GroupHeroPanel v-if="group" :group="group" :is-joining="isJoining" @join="submitAccessRequest" />
    <EmptyState v-else-if="error" title="Не удалось загрузить группу" :description="error" />
  </main>
</template>

<style scoped>
.group-preview {
  display: grid;
  gap: 34px;
}
</style>
