<script setup lang="ts">
defineProps<{
  statuses: readonly string[]
  selectedStatus: string
}>()

const emit = defineEmits<{
  'update:selectedStatus': [value: string]
}>()
</script>

<template>
  <section class="filters-panel">
    <div class="filter-group">
      <span class="filter-title">Статус групп</span>

      <div class="filter-options filter-options-column">
        <button
          v-for="status in statuses"
          :key="status"
          type="button"
          class="filter-chip"
          :class="{ active: selectedStatus === status }"
          @click="emit('update:selectedStatus', status)"
        >
          {{ status }}
        </button>
      </div>
    </div>
  </section>
</template>
