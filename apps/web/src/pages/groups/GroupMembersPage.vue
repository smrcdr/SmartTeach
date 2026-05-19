<script setup lang="ts">
import { Clipboard, UserPlus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { createDirectChat } from '@/features/chats/api/chats.api'
import { listMembers, type GroupMember } from '@/features/groups/api/groups.api'
import GroupMembersRoster from '@/features/groups/components/GroupMembersRoster.vue'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useClipboardCopy } from '@/shared/composables/useClipboardCopy'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const router = useRouter()
const { group } = useGroup()
const { items: members } = useGroupRouteList(listMembers)
const { copy: copyCode } = useClipboardCopy()
const canManage = computed(() => canManageGroup(group.value))
const isInviteDialogOpen = ref(false)
const selectedMember = ref<GroupMember | null>(null)
const memberMenuPosition = ref({ left: 12, top: 12 })
const isOpeningChat = ref(false)
const memberMenuStyle = computed(() => ({
  left: `${memberMenuPosition.value.left}px`,
  top: `${memberMenuPosition.value.top}px`
}))

function getMemberMenuPosition(event: MouseEvent) {
  const viewportPadding = 12
  const menuWidth = 280
  const menuHeight = 112
  const maxLeft = Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding)
  const maxTop = Math.max(viewportPadding, window.innerHeight - menuHeight - viewportPadding)

  return {
    left: Math.min(Math.max(event.clientX, viewportPadding), maxLeft),
    top: Math.min(Math.max(event.clientY + 8, viewportPadding), maxTop)
  }
}

function openMemberMenu(member: GroupMember, event: MouseEvent) {
  memberMenuPosition.value = getMemberMenuPosition(event)
  selectedMember.value = member
}

function toggleMemberMenuFromButton(member: GroupMember, event: Event) {
  if (selectedMember.value?.userId === member.userId) {
    selectedMember.value = null
    return
  }

  const element = event.currentTarget

  if (!(element instanceof HTMLElement)) {
    return
  }

  const rect = element.getBoundingClientRect()
  memberMenuPosition.value = {
    left: Math.min(Math.max(rect.right - 280, 12), Math.max(12, window.innerWidth - 292)),
    top: Math.min(rect.bottom + 8, Math.max(12, window.innerHeight - 124))
  }
  selectedMember.value = member
}

async function copyGroupCode() {
  if (!group.value?.code) {
    return
  }

  const copied = await copyCode(group.value.code)

  if (copied) {
    notifications.success('Код скопирован')
  } else {
    notifications.error('Не удалось скопировать код')
  }
}

async function openDirectChat() {
  if (!selectedMember.value || !auth.accessToken || isOpeningChat.value) {
    return
  }

  if (selectedMember.value.userId === auth.user?.id) {
    notifications.error('Нельзя создать чат с собой')
    return
  }

  isOpeningChat.value = true
  try {
    const chat = await createDirectChat(selectedMember.value.userId, auth.accessToken)
    selectedMember.value = null
    await router.push({ name: 'chats', query: { chatId: chat.id } })
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось открыть чат')
  } finally {
    isOpeningChat.value = false
  }
}

async function openPublicProfile() {
  if (!selectedMember.value) {
    return
  }

  const userId = selectedMember.value.userId

  selectedMember.value = null
  await router.push({ name: 'public-profile', params: { userId } })
}
</script>

<template>
  <main class="page" @click="selectedMember = null">
    <AppPageHeader
      eyebrow="Команда"
      title="Участники"
      description="Состав группы, роли и доступ к учебным материалам."
      align="split"
    >
      <template v-if="canManage" #actions>
        <AppButton @click="isInviteDialogOpen = true"><UserPlus :size="18" /> Пригласить</AppButton>
      </template>
    </AppPageHeader>

    <GroupMembersRoster
      :members="members"
      :selected-member-id="selectedMember?.userId ?? null"
      :current-user-id="auth.user?.id ?? null"
      :is-opening-chat="isOpeningChat"
      :menu-style="memberMenuStyle"
      @row-contextmenu="openMemberMenu"
      @actions-toggle="toggleMemberMenuFromButton"
      @open-chat="openDirectChat"
      @open-profile="openPublicProfile"
    />

    <div
      v-if="isInviteDialogOpen && group"
      class="invite-dialog"
      role="presentation"
      @click.self="isInviteDialogOpen = false"
    >
      <section
        class="invite-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-dialog-title"
      >
        <div>
          <span class="invite-dialog__eyebrow">Код группы</span>
          <h2 id="invite-dialog-title">Приглашение</h2>
        </div>
        <button
          class="invite-dialog__code"
          type="button"
          aria-label="Скопировать код группы"
          @click="copyGroupCode"
        >
          <Clipboard :size="20" />
          <strong>{{ group.code }}</strong>
        </button>
        <AppButton type="button" variant="secondary" @click="isInviteDialogOpen = false">Закрыть</AppButton>
      </section>
    </div>
  </main>
</template>

<style scoped>
.invite-dialog {
  align-items: center;
  background: rgb(0 0 0 / 34%);
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  padding: 24px;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 90;
}

.invite-dialog__panel {
  background: var(--color-menu-surface);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 20px;
  max-width: 420px;
  padding: 28px;
  width: min(100%, 420px);
}

.invite-dialog__eyebrow {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.invite-dialog h2 {
  color: var(--color-text);
  font-size: 1.45rem;
  line-height: 1.15;
  margin: 6px 0 0;
}

.invite-dialog__code {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  cursor: pointer;
  display: inline-flex;
  font-size: 2rem;
  font-weight: 900;
  gap: 12px;
  justify-content: center;
  letter-spacing: 0.08em;
  padding: 18px;
  text-align: center;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
  width: 100%;
}

.invite-dialog__code:hover {
  background: var(--color-surface-highest);
  border-color: var(--color-focus-border);
  transform: translateY(-1px);
}

.invite-dialog__code strong {
  font: inherit;
}
</style>
