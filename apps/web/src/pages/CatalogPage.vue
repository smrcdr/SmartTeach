<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CatalogFilters from '../components/CatalogFilters.vue'
import CourseGrid from '../components/CourseGrid.vue'
import { catalogFilters, recommendedCourses } from '../data/mockDashboard'

const route = useRoute()
const selectedLevel = ref<string[]>([])
const selectedLanguage = ref<string[]>([])
const selectedReviews = ref<string[]>([])
const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const mobileFiltersOpen = ref(false)

watch(
  () => route.query.q,
  (value) => {
    searchQuery.value = typeof value === 'string' ? value : ''
  },
)

const matchesReviewsRange = (reviewsCount: number, selectedRanges: string[]) => {
  if (selectedRanges.length === 0) return true

  return selectedRanges.some((range) => {
    if (range === 'Менее 10') return reviewsCount < 10
    if (range === '11-30') return reviewsCount >= 11 && reviewsCount <= 30
    if (range === '31-50') return reviewsCount >= 31 && reviewsCount <= 50
    if (range === '51-100') return reviewsCount >= 51 && reviewsCount <= 100
    if (range === '101-300') return reviewsCount >= 101 && reviewsCount <= 300
    if (range === '301-500') return reviewsCount >= 301 && reviewsCount <= 500
    if (range === '500+') return reviewsCount > 500

    return false
  })
}

const filteredCourses = computed(() => {
  return recommendedCourses.filter((course) => {
    const [, level] = course.tags

    const byLevel = selectedLevel.value.length === 0 || selectedLevel.value.includes(level)
    const byLanguage =
      selectedLanguage.value.length === 0 || selectedLanguage.value.includes(course.language)
    const byReviews = matchesReviewsRange(course.reviewsCount, selectedReviews.value)
    const bySearch =
      searchQuery.value.trim().length === 0 ||
      course.title.toLowerCase().includes(searchQuery.value.trim().toLowerCase())

    return byLevel && byLanguage && byReviews && bySearch
  })
})

const activeFilterChips = computed(() => [
  ...selectedLevel.value,
  ...selectedLanguage.value,
  ...selectedReviews.value,
])

const closeMobileFilters = () => {
  mobileFiltersOpen.value = false
}
</script>

<template>
  <main class="dashboard-layout">
    <section class="dashboard-main catalog-page">
      <section class="intro catalog-intro">
        <h1>Каталог групп</h1>
        <p class="intro-copy">
          Просматривайте доступные группы, отбирайте их по направлению и формату
          и находите подходящую учебную среду.
        </p>
      </section>

      <section class="catalog-layout">
        <aside class="catalog-sidebar catalog-sidebar-desktop">
          <CatalogFilters
            :filters="catalogFilters"
            :selected-level="selectedLevel"
            :selected-language="selectedLanguage"
            :selected-reviews="selectedReviews"
            @update:selected-level="selectedLevel = $event"
            @update:selected-language="selectedLanguage = $event"
            @update:selected-reviews="selectedReviews = $event"
          />
        </aside>

        <section class="catalog-content">
          <div class="mobile-filter-toolbar">
            <button type="button" class="mobile-filter-btn" @click="mobileFiltersOpen = true">
              <span class="material-symbols-outlined">tune</span>
              <span>Фильтры</span>
              <strong v-if="activeFilterChips.length > 0">{{ activeFilterChips.length }}</strong>
            </button>
          </div>

          <label class="catalog-search" aria-label="Поиск групп по названию">
            <span class="material-symbols-outlined search-icon">search</span>
            <input v-model="searchQuery" type="text" placeholder="Поиск групп по названию..." />
          </label>

          <div v-if="activeFilterChips.length > 0" class="active-filters-row">
            <span v-for="filter in activeFilterChips" :key="filter" class="active-filter-pill">
              {{ filter }}
            </span>
          </div>

          <section class="catalog-meta">
            <strong>Найдено групп: {{ filteredCourses.length }}</strong>
          </section>

          <CourseGrid :courses="filteredCourses" />
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

  <aside class="mobile-sheet" :class="{ open: mobileFiltersOpen }" aria-label="Фильтры каталога">
    <div class="mobile-sheet-header">
      <div>
        <strong>Фильтры</strong>
        <p>Настройте подборку групп под свои цели.</p>
      </div>

      <button type="button" class="mobile-menu-btn mobile-menu-btn-inside" aria-label="Закрыть фильтры" @click="closeMobileFilters">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <CatalogFilters
      :filters="catalogFilters"
      :selected-level="selectedLevel"
      :selected-language="selectedLanguage"
      :selected-reviews="selectedReviews"
      @update:selected-level="selectedLevel = $event"
      @update:selected-language="selectedLanguage = $event"
      @update:selected-reviews="selectedReviews = $event"
    />
  </aside>
</template>
