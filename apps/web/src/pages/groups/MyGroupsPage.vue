<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import GroupCatalogCard from '@/features/groups/components/GroupCatalogCard.vue'
import { useGroups } from '@/features/groups/composables/useGroups'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const { groups, isLoading, error } = useGroups({ mine: true })
</script>

<template>
  <main class="page my-groups">
    <AppPageHeader
      eyebrow="Рабочая область"
      title="Мои группы"
      description="Группы, в которых вы состоите и активно обучаетесь."
      align="split"
    >
      <template #actions>
        <RouterLink to="/groups/new">
          <AppButton><Plus :size="18" /> Создать группу</AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <div class="my-groups__search">
      <AppTextField placeholder="Поиск по названию..." />
    </div>

    <section class="my-groups__list">
      <GroupCatalogCard
        v-for="group in groups"
        :key="group.id"
        :group="group"
      />
      <EmptyState
        v-if="!isLoading && !error && groups.length === 0"
        title="У вас пока нет групп"
        description="Вступите в группу или создайте свою, и она появится здесь!"
      />
      <EmptyState v-if="error" title="Не удалось загрузить группы" :description="error" />
    </section>
  </main>
</template>

<style scoped>
.my-groups__search {
  margin-bottom: 28px;
  max-width: 640px;
}

.my-groups__list {
  display: grid;
  gap: 26px;
}
</style>
