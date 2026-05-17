<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import GroupCatalogCard from '@/features/groups/components/GroupCatalogCard.vue'
import { useGroups } from '@/features/groups/composables/useGroups'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const { groups, isLoading, error } = useGroups({ mine: true })
const search = ref('')

const filteredGroups = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) {
    return groups.value
  }

  return groups.value.filter((group) => {
    return `${group.name} ${group.description ?? ''} ${group.code}`.toLowerCase().includes(query)
  })
})

const categoryOptions = computed(() => [
  {
    key: 'all',
    label: 'Все',
    emptyTitle: 'У вас пока нет групп',
    emptyDescription: 'Вступите в группу или создайте свою, и она появится здесь!',
    groups: filteredGroups.value
  },
  {
    key: 'owner',
    label: 'Я владелец',
    emptyTitle: 'Вы пока не владелец групп',
    emptyDescription: 'Создайте группу, чтобы управлять учебными материалами, участниками и расписанием.',
    groups: filteredGroups.value.filter((group) => group.viewerMembershipRole === 'OWNER')
  },
  {
    key: 'participant',
    label: 'Я участник',
    emptyTitle: 'Вы пока не участник групп',
    emptyDescription: 'Вступите в группу по коду или заявке, чтобы она появилась в этом разделе.',
    groups: filteredGroups.value.filter((group) => group.viewerMembershipRole && group.viewerMembershipRole !== 'OWNER')
  }
])

type CategoryKey = (typeof categoryOptions.value)[number]['key']

const selectedCategory = ref<CategoryKey>('all')
const activeCategory = computed(() => categoryOptions.value.find((category) => (
  category.key === selectedCategory.value
)) ?? categoryOptions.value[0])
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

    <section class="my-groups__filters">
      <div class="my-groups__search">
        <span
          id="search"
          class="material-symbols-outlined my-groups__search-icon"
          aria-hidden="true"
          data-icon-id="search"
        >
          search
        </span>
        <input
          v-model="search"
          class="my-groups__search-input"
          type="search"
          aria-label="Поиск по названию"
          placeholder="Поиск по названию..."
        >
      </div>
    </section>

    <section v-if="!error && groups.length > 0" class="my-groups__filter" aria-label="Сортировка групп по роли">
      <button
        v-for="category in categoryOptions"
        :key="category.key"
        type="button"
        :class="['my-groups__filter-button', selectedCategory === category.key && 'my-groups__filter-button--active']"
        :aria-pressed="selectedCategory === category.key"
        @click="selectedCategory = category.key"
      >
        <span>{{ category.label }}</span>
        <strong>{{ category.groups.length.toLocaleString('ru-RU') }}</strong>
      </button>
    </section>

    <section v-if="!error && groups.length > 0" class="my-groups__list">
      <GroupCatalogCard
        v-for="group in activeCategory.groups"
        :key="group.id"
        :group="group"
      />
      <EmptyState
        v-if="activeCategory.groups.length === 0"
        :title="search.trim() ? 'Группы не найдены' : activeCategory.emptyTitle"
        :description="search.trim() ? 'Пока API не вернул группы по выбранному запросу.' : activeCategory.emptyDescription"
      />
    </section>

    <section class="my-groups__list">
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
.my-groups__filters {
  align-items: center;
  border-bottom: 1px solid var(--color-divider);
  border-top: 1px solid var(--color-divider);
  display: flex;
  margin-bottom: 24px;
  padding: 22px 0;
}

.my-groups__search {
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

.my-groups__search:focus-within {
  background: var(--color-surface-low);
  border-color: var(--color-outline);
  box-shadow: 0 0 0 3px rgb(21 25 108 / 7%);
}

.my-groups__search-icon {
  color: var(--color-text-muted);
  font-size: 24px;
  line-height: 1;
}

.my-groups__search-input {
  background: transparent;
  border: 0;
  color: var(--color-text);
  font: inherit;
  font-weight: 650;
  min-width: 0;
  outline: none;
  width: 100%;
}

.my-groups__search-input::placeholder {
  color: var(--color-text-muted);
  font-weight: 600;
}

.my-groups__search-input::-webkit-search-cancel-button {
  display: none;
}

.my-groups__filter {
  align-items: center;
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 24px;
  padding: 6px;
  width: fit-content;
}

.my-groups__filter-button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: var(--radius-xs);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  gap: 10px;
  font-size: 0.86rem;
  font-weight: 800;
  justify-content: center;
  min-height: 40px;
  padding: 9px 12px;
}

.my-groups__filter-button:not(.my-groups__filter-button--active):hover,
.my-groups__filter-button:not(.my-groups__filter-button--active):focus-visible {
  background: var(--color-surface-low);
  color: var(--color-text);
  outline: none;
}

.my-groups__filter-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.my-groups__filter-button--active {
  background: var(--color-primary);
  color: #fff;
}

.my-groups__filter-button strong {
  background: rgb(255 255 255 / 78%);
  border-radius: var(--radius-xs);
  color: var(--color-primary);
  font-size: 0.76rem;
  min-width: 28px;
  padding: 4px 7px;
}

.my-groups__filter-button:not(.my-groups__filter-button--active) strong {
  background: var(--color-secondary-container);
  color: #424464;
}

.my-groups__list {
  display: grid;
  gap: 26px;
}

@media (max-width: 640px) {
  .my-groups__search {
    max-width: none;
    width: 100%;
  }

  .my-groups__filter {
    width: 100%;
  }

  .my-groups__filter-button {
    flex: 1;
  }
}
</style>
