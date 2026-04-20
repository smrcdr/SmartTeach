<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ChatWorkspace from '../../features/chats/components/ChatWorkspace.vue'

const route = useRoute()
const groupId = computed(() => String(route.params.groupId ?? ''))
</script>

<template>
  <ChatWorkspace scope="group" :group-id="groupId" />
</template>
