<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDemoGroup } from '@/features/groups/composables/useDemoGroup'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatShortDate } from '@/shared/lib/date'

const route = useRoute()
const group = useDemoGroup()
const assignment = computed(() => group.value.assignments.find((item) => item.id === route.params.assignmentId) ?? group.value.assignments[0])
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader
      eyebrow="Задание"
      :title="assignment.title"
      :description="`${assignment.submissions} решений отправлено. Дедлайн ${formatShortDate(assignment.dueDate)}.`"
      align="split"
    >
      <template #actions>
        <StatusPill label="Published" tone="success" />
      </template>
    </AppPageHeader>
    <section class="surface-panel assignment-panel">
      <p>Описание задания, критерии проверки и файлы будут отображаться здесь в формате удобной карточки сдачи.</p>
      <AppButton>Отправить решение</AppButton>
    </section>
  </main>
</template>

<style scoped>
.assignment-panel {
  display: grid;
  gap: 22px;
  justify-items: start;
  padding: 30px;
}

.assignment-panel p {
  color: var(--color-text-muted);
  line-height: 1.65;
  margin: 0;
}
</style>
