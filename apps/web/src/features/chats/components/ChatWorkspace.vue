<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuth } from '../../auth/composables/useAuth'
import { getGroupsErrorMessage } from '../../groups/api/groups.api'
import { useGroupWorkspace } from '../../groups/composables/useGroupWorkspace'
import { useGroup } from '../../groups/composables/useGroups'
import { getChatsErrorMessage, type ChatType } from '../api/chats.api'
import { useChat, useChatPreviews, useChatsList, useCreateGroupChatMutation, useGroupChats } from '../composables/useChats'
import ChatSidebar from './ChatSidebar.vue'
import ChatThread from './ChatThread.vue'
import CreateGroupChatDialog from './CreateGroupChatDialog.vue'
import AppCard from '../../../shared/ui/AppCard.vue'

const props = withDefaults(
  defineProps<{
    scope: 'global' | 'group'
    groupId?: string
  }>(),
  {
    groupId: '',
  },
)

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuth()

const groupId = computed(() => (props.scope === 'group' ? props.groupId || String(route.params.groupId ?? '') : ''))
const activeChatId = computed(() => {
  const rawChatId = route.params.chatId
  return typeof rawChatId === 'string' ? rawChatId : ''
})
const selectedGlobalTab = ref<ChatType>('DIRECT')
const createDialogOpen = ref(false)
const createDialogError = ref('')

const workspace = useGroupWorkspace(groupId)
const globalChatsQuery = useChatsList(
  'global',
  computed(() => ({
    chatType: selectedGlobalTab.value,
  })),
  {
    enabled: computed(() => props.scope === 'global'),
  },
)
const groupChatsQuery = useGroupChats(groupId, {
  enabled: computed(() => props.scope === 'group' && workspace.isMember.value),
})
const activeChatQuery = useChat(activeChatId, {
  enabled: computed(() => Boolean(activeChatId.value)),
})
const createGroupChatMutation = useCreateGroupChatMutation(groupId)

const activeChat = computed(() => activeChatQuery.data.value ?? null)
const activeChatGroupQuery = useGroup(
  computed(() => activeChat.value?.groupId ?? ''),
  {
    enabled: computed(() => props.scope === 'global' && Boolean(activeChat.value?.groupId)),
  },
)

const chats = computed(() => {
  if (props.scope === 'group') {
    return groupChatsQuery.data.value ?? []
  }

  return globalChatsQuery.data.value ?? []
})

const previewsQuery = useChatPreviews(
  computed(() => chats.value.map((chat) => chat.id)),
  {
    enabled: computed(() => chats.value.length > 0),
  },
)

const previews = computed(() => previewsQuery.data.value ?? {})
const currentUserId = computed(() => currentUser.value?.id ?? '')
const isGroupScope = computed(() => props.scope === 'group')
const isChatModuleDisabled = computed(
  () =>
    isGroupScope.value &&
    Boolean(workspace.settings.value) &&
    !workspace.settings.value?.chatEnabled,
)
const canCreateGroupChat = computed(
  () => isGroupScope.value && workspace.canManageGroup.value && !workspace.isReadOnly.value,
)
const isListPending = computed(() => {
  if (isGroupScope.value) {
    return workspace.isWorkspacePending.value || groupChatsQuery.isPending.value || isChatModuleDisabled.value
  }

  return globalChatsQuery.isPending.value
})
const listErrorMessage = computed(() => {
  if (isGroupScope.value) {
    if (workspace.workspaceError.value) {
      return getGroupsErrorMessage(workspace.workspaceError.value, 'Не удалось собрать рабочее пространство группы')
    }

    if (groupChatsQuery.error.value) {
      return getChatsErrorMessage(groupChatsQuery.error.value, 'Не удалось загрузить групповые чаты')
    }

    return ''
  }

  return globalChatsQuery.error.value
    ? getChatsErrorMessage(globalChatsQuery.error.value, 'Не удалось загрузить чаты')
    : ''
})
const activeChatErrorMessage = computed(() => {
  if (activeChatQuery.error.value) {
    return getChatsErrorMessage(activeChatQuery.error.value, 'Не удалось открыть чат')
  }

  if (isGroupScope.value && activeChat.value && activeChat.value.groupId !== groupId.value) {
    return 'Этот чат не относится к текущей группе.'
  }

  return ''
})
const threadEmptyState = computed(() => {
  if (isGroupScope.value) {
    if (chats.value.length === 0) {
      return canCreateGroupChat.value
        ? {
            title: 'В группе пока нет комнат',
            description: 'Создайте первый чат, чтобы участники получили общее пространство для обсуждения.',
          }
        : {
            title: 'Комнаты пока не созданы',
            description: 'Когда владелец или администратор откроет первую комнату, она появится в этом разделе.',
          }
    }

    return {
      title: 'Выберите чат группы',
      description: 'Список доступных комнат остается слева, а активный диалог откроется справа.',
    }
  }

  if (selectedGlobalTab.value === 'DIRECT') {
    return chats.value.length === 0
      ? {
          title: 'Личных чатов пока нет',
          description: 'Откройте профиль пользователя, карточку участника или автора попытки, чтобы начать диалог.',
        }
      : {
          title: 'Выберите личный чат',
          description: 'На широком экране список остается слева, а активный диалог открывается справа.',
        }
  }

  return chats.value.length === 0
    ? {
        title: 'Групповых чатов пока нет',
        description: 'Они появятся здесь, когда в одной из ваших групп будет создана хотя бы одна комната.',
      }
    : {
        title: 'Выберите групповой чат',
        description: 'Лента сообщений откроется здесь без перехода на отдельную страницу.',
      }
})
const sidebarCopy = computed(() => {
  if (isGroupScope.value) {
    return {
      title: 'Чаты группы',
      description: 'Комнаты группы остаются частью рабочего пространства и не смешиваются с личными диалогами.',
    }
  }

  return selectedGlobalTab.value === 'DIRECT'
    ? {
        title: 'Личные чаты',
        description: 'Личные разговоры один на один собраны в отдельной вкладке.',
      }
    : {
        title: 'Групповые чаты',
        description: 'Здесь видны комнаты всех групп, где уже включен модуль чатов и у вас есть доступ.',
      }
})
const sidebarEmptyState = computed(() => {
  if (isGroupScope.value) {
    return canCreateGroupChat.value
      ? {
          title: 'Еще нет ни одной комнаты',
          description: 'Создайте первый чат и откройте групповое обсуждение прямо из рабочего пространства группы.',
        }
      : {
          title: 'Комнаты еще не созданы',
          description: 'Участники увидят здесь список чатов, как только владелец или администратор создаст первую комнату.',
        }
  }

  return selectedGlobalTab.value === 'DIRECT'
    ? {
        title: 'Пока нет личных диалогов',
        description: 'Используйте кнопку «Написать» из карточки пользователя или публичного профиля.',
      }
    : {
        title: 'Нет доступных групповых чатов',
        description: 'Они появятся после создания комнат в ваших активных группах.',
      }
})
const canModerateActiveChat = computed(() => {
  if (isGroupScope.value) {
    return workspace.canManageGroup.value
  }

  const membershipRole = activeChatGroupQuery.data.value?.viewerMembershipRole

  return membershipRole === 'OWNER' || membershipRole === 'ADMIN'
})
const isActiveChatReadOnly = computed(() => {
  if (isGroupScope.value) {
    return workspace.isReadOnly.value
  }

  return activeChatGroupQuery.data.value?.status === 'ARCHIVED'
})

watch(
  () => activeChat.value?.chatType,
  (nextType) => {
    if (!nextType || isGroupScope.value) {
      return
    }

    selectedGlobalTab.value = nextType
  },
)

watchEffect(() => {
  if (isGroupScope.value && !workspace.isWorkspacePending.value && isChatModuleDisabled.value) {
    void router.replace({
      name: 'group-overview',
      params: {
        groupId: groupId.value,
      },
    })
  }
})

function openChat(chatId: string) {
  if (isGroupScope.value) {
    void router.push({
      name: 'group-chat-details',
      params: {
        groupId: groupId.value,
        chatId,
      },
    })

    return
  }

  void router.push({
    name: 'chat-details',
    params: {
      chatId,
    },
  })
}

function closeChat() {
  if (isGroupScope.value) {
    void router.push({
      name: 'group-chats',
      params: {
        groupId: groupId.value,
      },
    })

    return
  }

  void router.push({
    name: 'chats',
  })
}

function switchGlobalTab(chatType: ChatType) {
  selectedGlobalTab.value = chatType
  createDialogError.value = ''

  if (activeChat.value && activeChat.value.chatType !== chatType) {
    closeChat()
  }
}

async function handleCreateGroupChat(title: string) {
  createDialogError.value = ''

  try {
    const chat = await createGroupChatMutation.mutateAsync({
      title,
    })

    createDialogOpen.value = false

    await router.push({
      name: 'group-chat-details',
      params: {
        groupId: groupId.value,
        chatId: chat.id,
      },
    })
  } catch (error) {
    createDialogError.value = getChatsErrorMessage(error, 'Не удалось создать групповой чат')
  }
}
</script>

<template>
  <div class="chat-workspace">
    <AppCard :class="['chat-workspace__sidebar-card', { 'chat-workspace__sidebar-card--hidden-mobile': activeChatId }]">
      <ChatSidebar
        :title="sidebarCopy.title"
        :description="sidebarCopy.description"
        :chats="chats"
        :previews="previews"
        :active-chat-id="activeChatId || null"
        :current-user-id="currentUserId"
        :show-tabs="!isGroupScope"
        :active-tab="selectedGlobalTab"
        :is-pending="isListPending"
        :error-message="listErrorMessage"
        :empty-title="sidebarEmptyState.title"
        :empty-description="sidebarEmptyState.description"
        :can-create-group-chat="canCreateGroupChat"
        @select-chat="openChat"
        @switch-tab="switchGlobalTab"
        @create-group-chat="createDialogOpen = true"
      />
    </AppCard>

    <AppCard :class="['chat-workspace__thread-card', { 'chat-workspace__thread-card--active-mobile': activeChatId }]">
      <ChatThread
        :chat="activeChat"
        :current-user-id="currentUserId"
        :empty-title="threadEmptyState.title"
        :empty-description="threadEmptyState.description"
        :is-chat-pending="activeChatQuery.isPending.value"
        :chat-error-message="activeChatErrorMessage"
        :can-moderate-group="canModerateActiveChat"
        :is-read-only="isActiveChatReadOnly"
        @back="closeChat"
      />
    </AppCard>

    <CreateGroupChatDialog
      :open="createDialogOpen"
      :is-busy="createGroupChatMutation.isPending.value"
      :error-message="createDialogError"
      @close="createDialogOpen = false"
      @submit="handleCreateGroupChat"
    />
  </div>
</template>

<style scoped>
.chat-workspace {
  display: grid;
  grid-template-columns: minmax(20rem, 24rem) minmax(0, 1fr);
  gap: 1rem;
  min-height: 42rem;
}

.chat-workspace__sidebar-card,
.chat-workspace__thread-card {
  align-self: stretch;
}

@media (max-width: 900px) {
  .chat-workspace {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .chat-workspace__sidebar-card--hidden-mobile {
    display: none;
  }

  .chat-workspace__thread-card {
    display: none;
  }

  .chat-workspace__thread-card--active-mobile,
  .chat-workspace__thread-card :deep(.empty-state) {
    display: grid;
  }
}
</style>
