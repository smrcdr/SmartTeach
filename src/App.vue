<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import { currentUser, navItems } from './data/mockDashboard'
</script>

<template>
  <div class="shell">
    <AppHeader :user="currentUser" :items="navItems" />
    <RouterView />
  </div>
</template>
