<script setup lang="ts">
import { MessageCircle, MoreVertical, UserRound } from 'lucide-vue-next'
import type { GroupMember } from '@/features/groups/api/groups.api'
import { getGroupRoleLabel } from '@/features/groups/lib/status-labels'
import EmptyState from '@/shared/ui/EmptyState.vue'
import ContentList from './ContentList.vue'

const props = defineProps<{
  members: GroupMember[]
  selectedMemberId: string | null
  currentUserId: string | null
  isOpeningChat: boolean
  menuStyle: {
    left: string
    top: string
  }
}>()

const emit = defineEmits<{
  'row-contextmenu': [member: GroupMember, event: MouseEvent]
  'actions-toggle': [member: GroupMember, event: Event]
  'open-chat': []
  'open-profile': []
}>()

function isMenuOpen(member: GroupMember) {
  return props.selectedMemberId === member.userId
}
</script>

<template>
  <ContentList title="Список участников">
    <div
      v-for="member in members"
      :key="member.userId"
      class="member-row-shell"
    >
      <button
        class="member-row"
        type="button"
        :aria-expanded="isMenuOpen(member)"
        @contextmenu.prevent.stop="emit('row-contextmenu', member, $event)"
      >
        <img v-if="member.user.avatarUrl" :src="member.user.avatarUrl" :alt="member.user.displayName" />
        <span v-else class="member-row__initials">{{ member.user.displayName.slice(0, 1) }}</span>
        <div>
          <h3>{{ member.user.displayName }}</h3>
          <p>{{ member.user.bio }}</p>
        </div>
        <strong>{{ getGroupRoleLabel(member.role) }}</strong>
        <span
          class="member-row__actions"
          role="button"
          tabindex="0"
          aria-label="Действия с участником"
          :aria-expanded="isMenuOpen(member)"
          @click.stop="emit('actions-toggle', member, $event)"
          @keydown.enter.stop.prevent="emit('actions-toggle', member, $event)"
          @keydown.space.stop.prevent="emit('actions-toggle', member, $event)"
        >
          <MoreVertical :size="18" />
        </span>
      </button>

      <section
        v-if="isMenuOpen(member)"
        class="member-menu"
        role="menu"
        :style="menuStyle"
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          :disabled="isOpeningChat || member.userId === currentUserId"
          @click="emit('open-chat')"
        >
          <MessageCircle :size="18" />
          {{ isOpeningChat ? 'Открываем...' : 'Написать' }}
        </button>
        <button type="button" role="menuitem" @click="emit('open-profile')">
          <UserRound :size="18" />
          Открыть профиль
        </button>
      </section>
    </div>
    <EmptyState v-if="members.length === 0" title="Участников пока нет" />
  </ContentList>
</template>

<style scoped>
.member-row-shell {
  position: relative;
}

.member-row {
  align-items: center;
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  color: inherit;
  cursor: pointer;
  display: grid;
  font: inherit;
  gap: 16px;
  grid-template-columns: 52px minmax(0, 1fr) auto 34px;
  padding: 18px 20px;
  text-align: left;
  transition: background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  width: 100%;
}

.member-row__actions {
  align-items: center;
  border-radius: 50%;
  color: var(--color-text-muted);
  display: inline-flex;
  height: 34px;
  justify-content: center;
  transition: background-color 160ms ease, color 160ms ease;
  width: 34px;
}

.member-row__actions:hover,
.member-row__actions:focus-visible {
  background: var(--color-surface-highest);
  color: var(--color-primary);
  outline: none;
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
  position: fixed;
  width: min(280px, calc(100vw - 24px));
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

@media (max-width: 620px) {
  .member-row {
    align-items: start;
    grid-template-columns: 44px minmax(0, 1fr) 34px;
  }

  .member-row strong {
    grid-column: 2;
  }
}
</style>
