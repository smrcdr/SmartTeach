<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ChatWorkspace from '../../features/chats/components/ChatWorkspace.vue'

const route = useRoute()
const groupId = computed(() => String(route.params.groupId ?? ''))
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Рабочее пространство / Чаты</span>
      <h1 class="page-title">Групповые комнаты остаются внутри рабочего пространства и не теряют контекст материалов.</h1>
      <p class="page-lead">
        История, поле ввода и сценарии модерации живут в том же контуре, что и уроки, задания и участники конкретной
        группы.
      </p>
    </header>

    <ChatWorkspace scope="group" :group-id="groupId" />
  </div>
</template>
