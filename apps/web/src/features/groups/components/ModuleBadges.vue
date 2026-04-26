<script setup lang="ts">
import { BookOpen, CalendarDays, ClipboardList, MessageCircle, Users } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { GroupModule } from '@/app/demo/types'

const props = defineProps<{
  modules: GroupModule[]
}>()

const moduleMap: Record<GroupModule, { label: string, icon: Component }> = {
  lessons: { label: 'Уроки', icon: BookOpen },
  assignments: { label: 'Задания', icon: ClipboardList },
  schedule: { label: 'Расписание', icon: CalendarDays },
  chats: { label: 'Чаты', icon: MessageCircle },
  members: { label: 'Участники', icon: Users }
}
</script>

<template>
  <div class="module-badges">
    <span v-for="moduleKey in props.modules" :key="moduleKey">
      <component :is="moduleMap[moduleKey].icon" :size="15" />
      {{ moduleMap[moduleKey].label }}
    </span>
  </div>
</template>

<style scoped>
.module-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.module-badges span {
  align-items: center;
  background: var(--color-surface-low);
  border-radius: 999px;
  color: var(--color-text-muted);
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 700;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
}
</style>
