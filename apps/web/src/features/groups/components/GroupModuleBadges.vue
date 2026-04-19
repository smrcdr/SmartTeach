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
  gap: 0.55rem;
}

.group-modules__item {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid rgba(31, 117, 156, 0.14);
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  font-size: 0.85rem;
  font-weight: 700;
}

.group-modules__item--muted {
  border-color: var(--color-border);
  background: var(--color-panel-muted);
  color: var(--color-subtle);
}
</style>
