<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <main class="dashboard-layout">
    <section class="dashboard-main">
      <section class="placeholder-page">
        <h1>{{ title }}</h1>
        <p>Эта страница пока не спроектирована. Сейчас доступны главная и каталог.</p>
      </section>
    </section>
  </main>
</template>
