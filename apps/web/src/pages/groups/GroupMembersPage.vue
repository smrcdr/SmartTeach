<script setup lang="ts">
import { UserPlus } from 'lucide-vue-next'
import { computed } from 'vue'
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
        <AppButton><UserPlus :size="18" /> Пригласить</AppButton>
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
</style>
