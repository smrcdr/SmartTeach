<script setup lang="ts">
import { UserPlus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import GroupCatalogCard from '@/features/groups/components/GroupCatalogCard.vue'
import { useGroups } from '@/features/groups/composables/useGroups'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
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
      title="Каталог групп"
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
      <div class="catalog-page__search">
        <span
          id="search"
          class="material-symbols-outlined catalog-page__search-icon"
          aria-hidden="true"
          data-icon-id="search"
        >
          search
        </span>
        <input
          v-model="search"
          class="catalog-page__search-input"
          type="search"
          aria-label="Поиск по названию"
          placeholder="Поиск по названию..."
        >
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
  border-bottom: 1px solid var(--color-divider);
  border-top: 1px solid var(--color-divider);
  display: flex;
  margin-bottom: 36px;
  padding: 22px 0;
}

.catalog-page__search {
  align-items: center;
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  display: grid;
  gap: 12px;
  grid-template-columns: 24px minmax(0, 1fr);
  min-height: 52px;
  max-width: 540px;
  padding: 0 16px;
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  width: min(100%, 540px);
}

.catalog-page__search:focus-within {
  background: var(--color-surface-low);
  border-color: var(--color-outline);
  box-shadow: 0 0 0 3px rgb(21 25 108 / 7%);
}

.catalog-page__search-icon {
  color: var(--color-text-muted);
  font-size: 24px;
  line-height: 1;
}

.catalog-page__search-input {
  background: transparent;
  border: 0;
  color: var(--color-text);
  font: inherit;
  font-weight: 650;
  min-width: 0;
  outline: none;
  width: 100%;
}

.catalog-page__search-input::placeholder {
  color: var(--color-text-muted);
  font-weight: 600;
}

.catalog-page__search-input::-webkit-search-cancel-button {
  display: none;
}

.catalog-page__join-button {
  align-items: center;
  background: var(--color-action-primary-bg);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-action-primary);
  color: var(--color-action-primary-text);
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
  box-shadow: var(--shadow-action-primary-hover);
  transform: translateY(-1px);
}

.catalog-page__join-button:focus-visible {
  outline: 3px solid var(--color-focus-border);
  outline-offset: 3px;
}

.catalog-page__list {
  display: grid;
  gap: 26px;
}

@media (max-width: 760px) {
  .catalog-page__search {
    max-width: none;
    width: 100%;
  }

  .catalog-page__join-button {
    width: 100%;
  }
}
</style>
