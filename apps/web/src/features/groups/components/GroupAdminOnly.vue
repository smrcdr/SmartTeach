<script setup lang="ts">
import { computed } from 'vue'
import { useGroup } from '../composables/useGroup'
import { canManageGroup } from '../lib/group-permissions'
import EmptyState from '@/shared/ui/EmptyState.vue'

withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: 'Недостаточно прав',
  description: 'Этот раздел доступен владельцу и администраторам группы.'
})

const { group, error, isLoading } = useGroup()
const canManage = computed(() => canManageGroup(group.value))
</script>

<template>
  <slot v-if="canManage" />
  <main v-else-if="isLoading" class="page narrow-page">
    <EmptyState title="Загружаем группу" description="Проверяем ваши права доступа." />
  </main>
  <main v-else class="page narrow-page">
    <EmptyState :title="title" :description="error ?? description" />
  </main>
</template>
