<script setup lang="ts">
import { UserPlus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import GroupCatalogCard from '@/features/groups/components/GroupCatalogCard.vue'
import { useGroups } from '@/features/groups/composables/useGroups'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const search = ref('')
const { groups, isLoading, error } = useGroups()

const filteredGroups = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) {
    return groups.value
  }

  return groups.value.filter((group) => {
    return `${group.name} ${group.description ?? ''} ${group.code}`.toLowerCase().includes(query)
  })
})
</script>

<template>
  <main class="page catalog-page">
    <AppPageHeader
      eyebrow="Каталог"
      title="Каталог курсов"
      description="Исследуйте коллекцию образовательных программ, созданных для глубокого погружения в дисциплины."
      align="split"
    >
      <template #actions>
        <RouterLink to="/groups/join" class="catalog-page__join-button">
          <UserPlus :size="18" />
          Вступить по коду
        </RouterLink>
      </template>
    </AppPageHeader>

    <section class="catalog-page__filters">
      <AppTextField v-model="search" placeholder="Поиск по названию..." />
      <div class="catalog-page__sort">
        <span>Сортировать:</span>
        <strong>По популярности</strong>
      </div>
    </section>

    <section class="catalog-page__list">
      <GroupCatalogCard
        v-for="group in filteredGroups"
        :key="group.id"
        :group="group"
      />
      <EmptyState
        v-if="!isLoading && !error && filteredGroups.length === 0"
        title="Группы не найдены"
        description="Пока API не вернул группы по выбранному запросу."
      />
      <EmptyState v-if="error" title="Не удалось загрузить каталог" :description="error" />
    </section>
  </main>
</template>

<style scoped>
.catalog-page__filters {
  align-items: center;
  border-bottom: 1px solid rgb(199 197 211 / 22%);
  border-top: 1px solid rgb(199 197 211 / 22%);
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(260px, 480px) 1fr;
  margin-bottom: 36px;
  padding: 22px 0;
}

.catalog-page__sort {
  color: var(--color-text-muted);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.catalog-page__sort span {
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.catalog-page__sort strong {
  color: var(--color-primary);
  font-size: 0.9rem;
}

.catalog-page__join-button {
  align-items: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  border-radius: var(--radius-sm);
  box-shadow: 0 16px 30px -18px rgb(21 25 108 / 60%);
  color: #fff;
  display: inline-flex;
  font-size: 0.92rem;
  font-weight: 800;
  gap: 10px;
  justify-content: center;
  min-height: 46px;
  padding: 0 20px;
  transition: background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  white-space: nowrap;
}

.catalog-page__join-button:hover {
  box-shadow: 0 18px 34px -20px rgb(21 25 108 / 72%);
  transform: translateY(-1px);
}

.catalog-page__join-button:focus-visible {
  outline: 3px solid rgb(21 25 108 / 22%);
  outline-offset: 3px;
}

.catalog-page__list {
  display: grid;
  gap: 26px;
}

@media (max-width: 760px) {
  .catalog-page__filters {
    grid-template-columns: 1fr;
  }

  .catalog-page__sort {
    justify-content: flex-start;
  }

  .catalog-page__join-button {
    width: 100%;
  }
}
</style>
