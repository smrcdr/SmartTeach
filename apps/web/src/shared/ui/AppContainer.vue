<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: 'default' | 'wide' | 'full'
  }>(),
  {
    size: 'default',
  },
)
</script>

<template>
  <div :class="['app-container', `app-container--${props.size}`]">
    <slot />
  </div>
</template>

<style scoped>
.app-container {
  width: min(100% - 2rem, var(--container-md));
  margin: 0 auto;
}

.app-container--wide {
  width: min(100% - 2rem, var(--container-lg));
}

.app-container--full {
  width: min(100% - 2rem, var(--container-xl));
}

@media (max-width: 640px) {
  .app-container,
  .app-container--wide,
  .app-container--full {
    width: min(100% - 1rem, var(--container-xl));
  }
}
</style>
