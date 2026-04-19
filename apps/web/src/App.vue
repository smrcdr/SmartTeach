<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from './features/auth/composables/useAuth'
import AppLoader from './shared/ui/AppLoader.vue'

const { isInitializing } = useAuth()
const router = useRouter()
const isRouterReady = ref(false)

void router.isReady().then(() => {
  isRouterReady.value = true
})
</script>

<template>
  <div v-if="!isRouterReady" class="app-bootstrap">
    <AppLoader :label="isInitializing ? 'Восстанавливаем сессию' : 'Запускаем приложение'" />
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
