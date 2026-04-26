<script setup lang="ts">
import GroupHeroPanel from '@/features/groups/components/GroupHeroPanel.vue'
import ContentList from '@/features/groups/components/ContentList.vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { createJoinRequest, joinGroup, listLessons } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const route = useRoute()
const router = useRouter()
const isJoining = ref(false)
const { group, error, refresh } = useGroup()
const { items: lessons } = useGroupRouteList(listLessons)

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

    <ContentList v-if="group" title="Что внутри группы" eyebrow="Содержание">
      <article v-for="lesson in lessons" :key="lesson.id" class="preview-row">
        <div>
          <h3>{{ lesson.title }}</h3>
          <p>{{ lesson.content }}</p>
        </div>
        <StatusPill :label="lesson.status === 'PUBLISHED' ? 'Опубликовано' : 'Черновик'" :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'" />
      </article>
      <EmptyState
        v-if="lessons.length === 0"
        title="Уроки еще не опубликованы"
        description="Когда API вернет уроки этой группы, они появятся в этом списке."
      />
    </ContentList>
  </main>
</template>

<style scoped>
.group-preview {
  display: grid;
  gap: 34px;
}

.preview-row {
  align-items: center;
  background: var(--color-surface-lowest);
  border-radius: var(--radius-md);
  display: flex;
  gap: 18px;
  justify-content: space-between;
  padding: 18px 20px;
}

.preview-row h3 {
  color: var(--color-primary);
  margin: 0 0 7px;
}

.preview-row p {
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
}
</style>
