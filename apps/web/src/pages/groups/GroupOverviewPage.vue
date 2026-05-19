<script setup lang="ts">
import { computed } from 'vue'
import { BookOpen, CalendarDays, ClipboardList, MessageCircle } from 'lucide-vue-next'
import { listGroupChats } from '@/features/chats/api/chats.api'
import GroupUsefulLinksSection from '@/features/groups/components/GroupUsefulLinksSection.vue'
import { listAssignments, listLessons, listScheduleEvents } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { getGroupStatusLabel } from '@/features/groups/lib/status-labels'
import { useClipboardCopy } from '@/shared/composables/useClipboardCopy'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import MetricTile from '@/shared/ui/MetricTile.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const { group, error } = useGroup()
const usefulLinksEnabled = computed(() => Boolean(group.value?.settings.usefulLinksEnabled))
const canManage = computed(() => canManageGroup(group.value))
const hasMetrics = computed(() => {
  const settings = group.value?.settings

  return Boolean(
    settings?.lessonsEnabled ||
    settings?.assignmentsEnabled ||
    settings?.scheduleEnabled ||
    settings?.chatEnabled
  )
})
const { isCopied: isCodeCopied, copy: copyCode } = useClipboardCopy()
const { items: lessons } = useGroupRouteList(listLessons, {
  enabled: () => Boolean(group.value?.settings.lessonsEnabled)
})
const { items: assignments } = useGroupRouteList(listAssignments, {
  enabled: () => Boolean(group.value?.settings.assignmentsEnabled)
})
const { items: schedule } = useGroupRouteList(listScheduleEvents, {
  enabled: () => Boolean(group.value?.settings.scheduleEnabled)
})
const { items: chats } = useGroupRouteList(listGroupChats, {
  enabled: () => Boolean(group.value?.settings.chatEnabled)
})

async function copyGroupCode() {
  if (!group.value) {
    return
  }

  await copyCode(group.value.code)
}
</script>

<template>
  <main v-if="group" class="page workspace-page">
    <AppPageHeader
      eyebrow="Рабочая область"
      :title="group.name"
      :description="group.description ?? undefined"
      align="split"
    >
      <template #actions>
        <StatusPill :label="getGroupStatusLabel(group.status)" tone="success" />
      </template>
    </AppPageHeader>

    <section class="workspace-page__meta">
      <button
        type="button"
        class="workspace-page__code-button"
        :class="{ 'workspace-page__code-button--copied': isCodeCopied }"
        aria-live="polite"
        @click="copyGroupCode"
      >
        <span class="workspace-page__code-text">Код {{ group.code }}</span>
        <span class="workspace-page__code-toast" :class="{ 'workspace-page__code-toast--visible': isCodeCopied }">
          Скопировано
        </span>
      </button>
    </section>

    <section v-if="hasMetrics" class="workspace-page__metrics">
      <MetricTile v-if="group.settings.lessonsEnabled" label="Материалов" :value="lessons.length" detail="Опубликованные и черновики" :icon="BookOpen" />
      <MetricTile v-if="group.settings.assignmentsEnabled" label="Заданий" :value="assignments.length" detail="Активные проверки" :icon="ClipboardList" />
      <MetricTile v-if="group.settings.scheduleEnabled" label="Событий" :value="schedule.length" detail="Ближайшие встречи" :icon="CalendarDays" />
      <MetricTile v-if="group.settings.chatEnabled" label="Чатов" :value="chats.length" detail="Коммуникация группы" :icon="MessageCircle" />
    </section>

    <GroupUsefulLinksSection
      v-if="usefulLinksEnabled"
      :enabled="usefulLinksEnabled"
      :can-manage="canManage"
    />
  </main>
  <main v-else class="page">
    <EmptyState title="Не удалось загрузить группу" :description="error ?? 'Данные группы ожидаются от API.'" />
  </main>
</template>

<style scoped>
.workspace-page__meta {
  margin-bottom: 20px;
}

.workspace-page__code-button {
  align-items: center;
  background: var(--color-surface-high);
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-weight: 750;
  min-height: 42px;
  overflow: hidden;
  padding: 0 20px;
  position: relative;
  transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.workspace-page__code-button:hover {
  transform: translateY(-1px);
}

.workspace-page__code-button:active {
  transform: translateY(0) scale(0.98);
}

.workspace-page__code-button:focus-visible {
  outline: 3px solid var(--color-focus-border);
  outline-offset: 3px;
}

.workspace-page__code-button--copied {
  background: color-mix(in srgb, var(--color-primary-container) 18%, var(--color-surface-high));
  color: color-mix(in srgb, var(--color-primary) 72%, var(--color-text));
}

.workspace-page__code-text {
  transition: transform 180ms ease, opacity 180ms ease;
  white-space: nowrap;
}

.workspace-page__code-toast {
  color: color-mix(in srgb, var(--color-primary) 72%, var(--color-text));
  font-size: 0.76rem;
  font-weight: 800;
  left: 50%;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translate(-50%, calc(-50% + 8px));
  transition: opacity 180ms ease, transform 180ms ease;
  white-space: nowrap;
}

.workspace-page__code-button--copied .workspace-page__code-text {
  opacity: 0;
  transform: translateY(-8px);
}

.workspace-page__code-toast--visible {
  opacity: 1;
  transform: translate(-50%, -50%);
}

.workspace-page__metrics {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  margin-bottom: 28px;
}
</style>
