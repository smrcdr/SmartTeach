<script setup lang="ts">
import { BookOpen, CalendarDays, ClipboardList, Link, MessageCircle, Users } from 'lucide-vue-next'
import type { Component } from 'vue'
import { computed } from 'vue'
import type { GroupSettings } from '../api/groups.api'

const props = defineProps<{
  settings: GroupSettings
}>()

type GroupModule = 'lessons' | 'assignments' | 'schedule' | 'chats' | 'usefulLinks' | 'members'

const moduleMap: Record<GroupModule, { label: string, icon: Component }> = {
  lessons: { label: 'Материалы', icon: BookOpen },
  assignments: { label: 'Задания', icon: ClipboardList },
  schedule: { label: 'Расписание', icon: CalendarDays },
  chats: { label: 'Чаты', icon: MessageCircle },
  usefulLinks: { label: 'Ссылки', icon: Link },
  members: { label: 'Участники', icon: Users }
}

const enabledModules = computed<GroupModule[]>(() => [
  ...(props.settings.lessonsEnabled ? ['lessons' as const] : []),
  ...(props.settings.assignmentsEnabled ? ['assignments' as const] : []),
  ...(props.settings.scheduleEnabled ? ['schedule' as const] : []),
  ...(props.settings.chatEnabled ? ['chats' as const] : []),
  ...(props.settings.usefulLinksEnabled ? ['usefulLinks' as const] : []),
  'members'
])
</script>

<template>
  <div class="module-badges">
    <span v-for="moduleKey in enabledModules" :key="moduleKey">
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
