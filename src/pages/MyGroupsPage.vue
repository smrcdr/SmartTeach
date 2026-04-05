<script setup lang="ts">
import { computed, ref } from 'vue'
import CourseGrid from '../components/CourseGrid.vue'
import MyGroupsStatusFilters from '../components/MyGroupsStatusFilters.vue'
import { myGroups, myGroupsStatuses } from '../data/mockDashboard'

const selectedStatus = ref('Активные')
const searchQuery = ref('')

const filteredGroups = computed(() =>
  myGroups.filter((group) => {
    const byStatus = group.status === selectedStatus.value
    const bySearch =
      searchQuery.value.trim().length === 0 ||
      group.title.toLowerCase().includes(searchQuery.value.trim().toLowerCase())

    return byStatus && bySearch
  }),
)
</script>

<template>
  <main class="dashboard-layout">
    <section class="dashboard-main catalog-page">
      <section class="intro catalog-intro">
        <h1>Мои группы</h1>
        <p class="intro-copy">
          Управляйте своими активными, архивированными и удаленными группами в одном месте.
        </p>
      </section>

      <section class="catalog-layout">
        <aside class="catalog-sidebar">
          <MyGroupsStatusFilters
            :statuses="myGroupsStatuses"
            :selected-status="selectedStatus"
            @update:selected-status="selectedStatus = $event"
          />
        </aside>

        <section class="catalog-content">
          <label class="catalog-search" aria-label="Поиск моих групп по названию">
            <span class="material-symbols-outlined search-icon">search</span>
            <input v-model="searchQuery" type="text" placeholder="Поиск моих групп..." />
          </label>

          <section class="catalog-meta">
            <strong>Найдено групп: {{ filteredGroups.length }}</strong>
          </section>

          <CourseGrid :courses="filteredGroups" />
        </section>
      </section>
    </section>
  </main>
</template>
