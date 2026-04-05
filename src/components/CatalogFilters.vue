<script setup lang="ts">
import type { FilterGroup } from '../types/dashboard'

defineProps<{
  filters: FilterGroup[]
  selectedLevel: string[]
  selectedLanguage: string[]
  selectedReviews: string[]
}>()

const emit = defineEmits<{
  'update:selectedLevel': [value: string[]]
  'update:selectedLanguage': [value: string[]]
  'update:selectedReviews': [value: string[]]
}>()

const toggleValue = (values: string[], value: string) => {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

const onSelect = (key: string, value: string, values: string[]) => {
  if (key === 'level') emit('update:selectedLevel', toggleValue(values, value))
  if (key === 'language') emit('update:selectedLanguage', toggleValue(values, value))
  if (key === 'reviews') emit('update:selectedReviews', toggleValue(values, value))
}
</script>

<template>
  <section class="filters-panel">
    <div v-for="filter in filters" :key="filter.key" class="filter-group">
      <span class="filter-title">{{ filter.title }}</span>

      <div class="filter-options">
        <button
          v-for="option in filter.options"
          :key="option"
          type="button"
          class="filter-chip"
          :class="{
            active:
              (filter.key === 'level' && selectedLevel.includes(option)) ||
              (filter.key === 'language' && selectedLanguage.includes(option)) ||
              (filter.key === 'reviews' && selectedReviews.includes(option)),
          }"
          @click="
            onSelect(
              filter.key,
              option,
              filter.key === 'level'
                ? selectedLevel
                : filter.key === 'language'
                  ? selectedLanguage
                  : selectedReviews,
            )
          "
        >
          {{ option }}
        </button>
      </div>
    </div>
  </section>
</template>
