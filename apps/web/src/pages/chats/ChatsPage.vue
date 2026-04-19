<script setup lang="ts">
import ChatWorkspace from '../../features/chats/components/ChatWorkspace.vue'
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">App / Chats</span>
      <h1 class="page-title">Чаты собирают личные диалоги и групповые комнаты в одном рабочем контуре.</h1>
      <p class="page-lead">
        На desktop список и активный диалог живут в split view, а на mobile поток естественно раскладывается на
        список и отдельный экран сообщения.
      </p>
    </header>

    <ChatWorkspace scope="global" />
  </div>
</template>
