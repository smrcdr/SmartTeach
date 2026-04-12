<script setup lang="ts">
import { computed, ref } from 'vue'
import CourseGrid from '../components/CourseGrid.vue'
import MyGroupsStatusFilters from '../components/MyGroupsStatusFilters.vue'
import { myGroups, myGroupsStatuses } from '../data/mockDashboard'

const selectedStatus = ref('Активные')
const searchQuery = ref('')
const mobileFiltersOpen = ref(false)

const filteredGroups = computed(() =>
  myGroups.filter((group) => {
    const byStatus = group.status === selectedStatus.value
    const bySearch =
      searchQuery.value.trim().length === 0 ||
      group.title.toLowerCase().includes(searchQuery.value.trim().toLowerCase())

    return byStatus && bySearch
  }),
)

const closeMobileFilters = () => {
  mobileFiltersOpen.value = false
}

const updateSelectedStatus = (value: string) => {
  selectedStatus.value = value
  closeMobileFilters()
}
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
        <aside class="catalog-sidebar catalog-sidebar-desktop">
          <MyGroupsStatusFilters
            :statuses="myGroupsStatuses"
            :selected-status="selectedStatus"
            @update:selected-status="selectedStatus = $event"
          />
        </aside>

        <section class="catalog-content">
          <div class="mobile-filter-toolbar">
            <button type="button" class="mobile-filter-btn" @click="mobileFiltersOpen = true">
              <span class="material-symbols-outlined">tune</span>
              <span>Статус</span>
            </button>
          </div>

          <label class="catalog-search" aria-label="Поиск моих групп по названию">
            <span class="material-symbols-outlined search-icon">search</span>
            <input v-model="searchQuery" type="text" placeholder="Поиск моих групп..." />
          </label>

          <div class="active-filters-row">
            <span class="active-filter-pill">{{ selectedStatus }}</span>
          </div>

          <section class="catalog-meta">
            <strong>Найдено групп: {{ filteredGroups.length }}</strong>
          </section>

          <CourseGrid :courses="filteredGroups" />
        </section>
      </section>
    </section>
  </main>

  <div
    v-if="mobileFiltersOpen"
    class="mobile-sheet-backdrop"
    aria-hidden="true"
    @click="closeMobileFilters"
  ></div>

  <aside class="mobile-sheet" :class="{ open: mobileFiltersOpen }" aria-label="Фильтр по статусу">
    <div class="mobile-sheet-header">
      <div>
        <strong>Статус групп</strong>
        <p>Переключайтесь между активными, архивом и удаленными группами.</p>
      </div>

      <button type="button" class="mobile-menu-btn mobile-menu-btn-inside" aria-label="Закрыть фильтр" @click="closeMobileFilters">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <MyGroupsStatusFilters
      :statuses="myGroupsStatuses"
      :selected-status="selectedStatus"
      @update:selected-status="updateSelectedStatus"
    />
  </aside>
</template>
