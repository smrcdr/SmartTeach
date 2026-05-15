<script setup lang="ts">
import { MessageCirclePlus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { createGroupChat, listGroupChats } from '@/features/chats/api/chats.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const { group } = useGroup()
const { items: chats, groupId, refresh } = useGroupRouteList(listGroupChats)
const canManage = computed(() => canManageGroup(group.value))
const title = ref('')
const isSubmitting = ref(false)

async function submit() {
  if (!auth.accessToken || !groupId.value || isSubmitting.value) {
    return
  }

  const normalizedTitle = title.value.trim()

  if (normalizedTitle.length < 2) {
    notifications.error('Название чата должно быть не короче 2 символов')
    return
  }

  isSubmitting.value = true

  try {
    await createGroupChat(groupId.value, { title: normalizedTitle }, auth.accessToken)
    title.value = ''
    notifications.success('Чат группы создан')
    await refresh()
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось создать чат')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Коммуникация"
      title="Чаты группы"
      description="Темы для обсуждений, ревью и быстрых вопросов внутри учебного процесса."
      align="split"
    >
      <template v-if="canManage" #actions>
        <RouterLink :to="{ name: 'chats', query: { groupId } }">
          <AppButton variant="secondary">Открыть чаты</AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <form v-if="canManage" class="group-chat-form surface-panel" @submit.prevent="submit">
      <AppTextField v-model="title" name="title" label="Новый чат" placeholder="Например: Общие вопросы" />
      <AppButton type="submit" :disabled="isSubmitting">
        <MessageCirclePlus :size="18" /> {{ isSubmitting ? 'Создаём...' : 'Создать чат' }}
      </AppButton>
    </form>

    <ContentList title="Каналы">
      <WorkspaceItem
        v-for="chat in chats"
        :key="chat.id"
        :title="chat.title ?? 'Групповой чат'"
        :description="chat.lastMessageAt ? `Последнее сообщение ${chat.lastMessageAt}` : 'Сообщений пока нет'"
      >
        <template #aside>
          <RouterLink :to="{ name: 'chats', query: { chatId: chat.id } }">
            <AppButton size="sm" variant="secondary">Открыть</AppButton>
          </RouterLink>
        </template>
      </WorkspaceItem>
      <EmptyState v-if="chats.length === 0" title="Чатов пока нет" />
    </ContentList>
  </main>
</template>

<style scoped>
.group-chat-form {
  align-items: end;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) auto;
  margin-bottom: 24px;
  padding: 20px;
}

@media (max-width: 680px) {
  .group-chat-form {
    align-items: stretch;
    grid-template-columns: 1fr;
  }
}
</style>
