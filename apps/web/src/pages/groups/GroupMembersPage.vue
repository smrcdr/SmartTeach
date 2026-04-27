<script setup lang="ts">
import { Clipboard, MessageCircle, UserPlus, UserRound } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { createDirectChat } from '@/features/chats/api/chats.api'
import { listMembers, type GroupMember } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import ContentList from '@/features/groups/components/ContentList.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const router = useRouter()
const { group } = useGroup()
const { items: members } = useGroupRouteList(listMembers)
const canManage = computed(() => canManageGroup(group.value))
const isInviteDialogOpen = ref(false)
const selectedMember = ref<GroupMember | null>(null)
const isOpeningChat = ref(false)

function toggleMemberMenu(member: GroupMember) {
  selectedMember.value = selectedMember.value?.userId === member.userId ? null : member
}

async function copyGroupCode() {
  if (!group.value?.code) {
    return
  }

  try {
    await navigator.clipboard.writeText(group.value.code)
    notifications.success('Код скопирован')
  } catch {
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

    <ContentList title="Список участников">
      <div
        v-for="member in members"
        :key="member.userId"
        class="member-row-shell"
      >
        <button
          class="member-row"
          type="button"
          :aria-expanded="selectedMember?.userId === member.userId"
          @click.stop="toggleMemberMenu(member)"
        >
          <img v-if="member.user.avatarUrl" :src="member.user.avatarUrl" :alt="member.user.displayName" />
          <span v-else class="member-row__initials">{{ member.user.displayName.slice(0, 1) }}</span>
          <div>
            <h3>{{ member.user.displayName }}</h3>
            <p>{{ member.user.bio }}</p>
          </div>
          <strong>{{ member.role }}</strong>
        </button>

        <section
          v-if="selectedMember?.userId === member.userId"
          class="member-menu"
          role="menu"
          @click.stop
        >
          <button
            type="button"
            role="menuitem"
            :disabled="isOpeningChat || member.userId === auth.user?.id"
            @click="openDirectChat"
          >
            <MessageCircle :size="18" />
            {{ isOpeningChat ? 'Открываем...' : 'Написать' }}
          </button>
          <button type="button" role="menuitem" @click="openPublicProfile">
            <UserRound :size="18" />
            Открыть профиль
          </button>
        </section>
      </div>
      <EmptyState v-if="members.length === 0" title="Участников пока нет" />
    </ContentList>

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
.member-row-shell {
  position: relative;
}

.member-row {
  align-items: center;
  background: var(--color-surface-lowest);
  border-radius: var(--radius-md);
  border: 0;
  color: inherit;
  cursor: pointer;
  display: grid;
  font: inherit;
  gap: 16px;
  grid-template-columns: 52px 1fr auto;
  padding: 18px 20px;
  text-align: left;
  transition: background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  width: 100%;
}

.member-row:hover {
  background: var(--color-surface-low);
  box-shadow: 0 12px 32px -24px rgb(21 25 108 / 42%);
  transform: translateY(-1px);
}

.member-row img,
.member-row__initials {
  border-radius: 50%;
  height: 52px;
  width: 52px;
}

.member-row img {
  object-fit: cover;
}

.member-row__initials {
  align-items: center;
  background: var(--color-primary);
  color: #fff;
  display: inline-flex;
  font-weight: 850;
  justify-content: center;
  text-transform: uppercase;
}

.member-row h3,
.member-row p {
  margin: 0;
}

.member-row h3 {
  color: var(--color-primary);
  margin-bottom: 5px;
}

.member-row p {
  color: var(--color-text-muted);
  line-height: 1.45;
}

.member-row strong {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.member-menu {
  background: var(--color-menu-surface);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 4px;
  min-width: 248px;
  padding: 10px;
  position: absolute;
  right: 16px;
  top: calc(100% + 8px);
  z-index: 20;
}

.member-menu button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 650;
  gap: 10px;
  min-height: 42px;
  padding: 0 14px;
  text-align: left;
}

.member-menu button:hover:not(:disabled),
.member-menu button:focus-visible:not(:disabled) {
  background: var(--color-menu-hover);
  color: var(--color-primary);
  outline: none;
}

.member-menu button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

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

@media (max-width: 620px) {
  .member-menu {
    left: 12px;
    right: 12px;
  }

  .member-row {
    align-items: start;
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .member-row strong {
    grid-column: 2;
  }
}
</style>
