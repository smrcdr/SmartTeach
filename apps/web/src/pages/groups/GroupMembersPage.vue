<script setup lang="ts">
import { UserPlus } from 'lucide-vue-next'
import { useDemoGroup } from '@/features/groups/composables/useDemoGroup'
import ContentList from '@/features/groups/components/ContentList.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'

const group = useDemoGroup()
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Команда"
      title="Участники"
      description="Состав группы, роли и доступ к учебным материалам."
      align="split"
    >
      <template #actions>
        <AppButton><UserPlus :size="18" /> Пригласить</AppButton>
      </template>
    </AppPageHeader>

    <ContentList title="Список участников">
      <article v-for="member in group.members" :key="member.id" class="member-row">
        <img :src="member.avatarUrl" :alt="member.name" />
        <div>
          <h3>{{ member.name }}</h3>
          <p>{{ member.bio }}</p>
        </div>
        <strong>{{ member.role }}</strong>
      </article>
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

.member-row img {
  border-radius: 50%;
  height: 52px;
  object-fit: cover;
  width: 52px;
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
