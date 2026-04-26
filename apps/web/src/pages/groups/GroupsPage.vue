<script setup lang="ts">
import { computed, ref } from 'vue'
import GroupCatalogCard from '@/features/groups/components/GroupCatalogCard.vue'
import { useGroups } from '@/features/groups/composables/useGroups'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'

const search = ref('')
const { groups } = useGroups()

const filteredGroups = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) {
    return groups.value
  }

  return groups.value.filter((group) => {
    return `${group.title} ${group.description} ${group.code}`.toLowerCase().includes(query)
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
        <RouterLink to="/groups/join" class="catalog-page__join">Вступить по коду</RouterLink>
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

.catalog-page__sort strong,
.catalog-page__join {
  color: var(--color-primary);
  font-size: 0.9rem;
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
}
</style>
