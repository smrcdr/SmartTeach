<script setup lang="ts">
import AppCard from '../../shared/ui/AppCard.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

const chatScenarios = [
  'глобальный список direct и group chats',
  'отдельный поток создания direct-чата',
  'точка входа в конкретный групповой чат из workspace',
]
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">App Shell / Chats</span>
      <h1 class="page-title">Глобальные чаты уже вынесены в отдельный продуктовый раздел.</h1>
      <p class="page-lead">
        Шаг 4 подготавливает общий shell и route, а реальный chat flow с websocket и message list подключится позже.
      </p>
    </header>

    <div class="section-grid">
      <AppCard class="span-7">
        <AppLoader label="Здесь появится chat list после подключения queries и websocket transport." />
      </AppCard>

      <AppCard class="span-5" tone="accent">
        <h2 class="section-title">Покрываемые сценарии</h2>
        <ul class="list-copy">
          <li v-for="scenario in chatScenarios" :key="scenario">{{ scenario }}</li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}
</style>
