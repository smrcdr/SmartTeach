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
        <aside class="catalog-sidebar">
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
          <label class="catalog-search" aria-label="Поиск групп по названию">
            <span class="material-symbols-outlined search-icon">search</span>
            <input v-model="searchQuery" type="text" placeholder="Поиск групп по названию..." />
          </label>

          <section class="catalog-meta">
            <strong>Найдено групп: {{ filteredCourses.length }}</strong>
          </section>

          <CourseGrid :courses="filteredCourses" />
        </section>
      </section>
    </section>
  </main>
</template>
