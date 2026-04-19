<script setup lang="ts">
import { useAuth } from './features/auth/composables/useAuth'
import AppLoader from './shared/ui/AppLoader.vue'

const { isInitializing } = useAuth()
</script>

<template>
  <div v-if="isInitializing" class="app-bootstrap">
    <AppLoader label="Восстанавливаем сессию" />
  </div>
  <RouterView v-else />
</template>

<style scoped>
.app-bootstrap {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 2rem;
}
</style>
