<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import { currentUser, navItems } from './data/mockDashboard'

type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'smarteach-theme'

const theme = ref<ThemeMode>('dark')

const applyTheme = (value: ThemeMode) => {
  document.documentElement.dataset.theme = value
}

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

onMounted(() => {
  const savedTheme = localStorage.getItem(STORAGE_KEY)

  if (savedTheme === 'light' || savedTheme === 'dark') {
    theme.value = savedTheme
  }

  applyTheme(theme.value)
})

watch(theme, (value) => {
  applyTheme(value)
  localStorage.setItem(STORAGE_KEY, value)
})
</script>

<template>
  <div class="shell">
    <AppHeader :user="currentUser" :items="navItems" :theme="theme" @toggle-theme="toggleTheme" />
    <RouterView />
  </div>
</template>
