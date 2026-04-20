<script setup lang="ts">
withDefaults(
  defineProps<{
    modules: string[]
  }>(),
  {
    modules: () => [],
  },
)
</script>

<template>
  <div class="group-modules">
    <span v-for="moduleName in modules" :key="moduleName" class="group-modules__item">
      {{ moduleName }}
    </span>
    <span v-if="modules.length === 0" class="group-modules__item group-modules__item--muted">Модули отключены</span>
  </div>
</template>

<style scoped>
.group-modules {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.group-modules__item {
  padding: 6px 8px;
  border-radius: 10px;
  background: #f4f8fb;
  color: #7b8ba0;
  font-size: 0.73rem;
  font-weight: 700;
}

.group-modules__item--muted {
  background: #eef3f8;
  color: var(--color-subtle);
}
</style>
