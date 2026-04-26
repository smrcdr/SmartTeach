<script setup lang="ts">
import { UserPlus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { listMembers } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import ContentList from '@/features/groups/components/ContentList.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const { group } = useGroup()
const { items: members } = useGroupRouteList(listMembers)
const canManage = computed(() => canManageGroup(group.value))
const isInviteDialogOpen = ref(false)
</script>

<template>
  <main class="page">
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
      <article v-for="member in members" :key="member.userId" class="member-row">
        <img v-if="member.user.avatarUrl" :src="member.user.avatarUrl" :alt="member.user.displayName" />
        <span v-else class="member-row__initials">{{ member.user.displayName.slice(0, 1) }}</span>
        <div>
          <h3>{{ member.user.displayName }}</h3>
          <p>{{ member.user.bio }}</p>
        </div>
        <strong>{{ member.role }}</strong>
      </article>
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
        <strong class="invite-dialog__code">{{ group.code }}</strong>
        <AppButton type="button" variant="secondary" @click="isInviteDialogOpen = false">Закрыть</AppButton>
      </section>
    </div>
  </main>
</template>

<style scoped>
.member-row {
  align-items: center;
  background: var(--color-surface-lowest);
  border-radius: var(--radius-md);
  display: grid;
  gap: 16px;
  grid-template-columns: 52px 1fr auto;
  padding: 18px 20px;
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
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  display: block;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 18px;
  text-align: center;
}
</style>
