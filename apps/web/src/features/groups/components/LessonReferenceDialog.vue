<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { getLesson, type Lesson } from '@/features/groups/api/groups.api'
import AppButton from '@/shared/ui/AppButton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import MarkdownPreview from './MarkdownPreview.vue'

const props = defineProps<{
  groupId: string
  lessonId: string
  token?: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const currentLessonId = ref(props.lessonId)
const lesson = ref<Lesson | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(false)

async function refresh() {
  if (!props.groupId || !currentLessonId.value || !props.token) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    lesson.value = await getLesson(props.groupId, currentLessonId.value, props.token)
  } catch (caught) {
    lesson.value = null
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить урок'
  } finally {
    isLoading.value = false
  }
}

function openNestedLesson(lessonId: string) {
  currentLessonId.value = lessonId
}

watch(
  () => props.lessonId,
  (lessonId) => {
    currentLessonId.value = lessonId
  }
)

watch(currentLessonId, () => void refresh(), { immediate: true })
</script>

<template>
  <div class="lesson-reference-dialog" role="presentation" @click.self="emit('close')">
    <section
      class="lesson-reference-dialog__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-reference-title"
    >
      <header class="lesson-reference-dialog__header">
        <div>
          <span class="lesson-reference-dialog__eyebrow">Связанный урок</span>
          <h2 id="lesson-reference-title">{{ lesson?.title ?? 'Урок' }}</h2>
        </div>
        <button class="lesson-reference-dialog__close" type="button" aria-label="Закрыть" @click="emit('close')">
          <X :size="18" />
        </button>
      </header>

      <div v-if="lesson" class="lesson-reference-dialog__meta">
        <StatusPill :label="lesson.status" :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'" />
      </div>

      <div class="lesson-reference-dialog__body">
        <MarkdownPreview
          v-if="lesson"
          :content="lesson.content"
          handle-lesson-links
          @lesson-link="openNestedLesson"
        />
        <EmptyState
          v-else
          :title="isLoading ? 'Загружаем урок' : 'Урок не загружен'"
          :description="error ?? 'Материал ожидается от API.'"
        />
      </div>

      <footer class="lesson-reference-dialog__actions">
        <RouterLink
          v-if="lesson"
          :to="{ name: 'group-lesson-details', params: { groupId, lessonId: currentLessonId } }"
          @click="emit('close')"
        >
          <AppButton type="button">Открыть страницу урока</AppButton>
        </RouterLink>
        <AppButton type="button" variant="secondary" @click="emit('close')">Закрыть</AppButton>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.lesson-reference-dialog {
  align-items: center;
  background: rgb(0 0 0 / 38%);
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  padding: 24px;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 92;
}

.lesson-reference-dialog__panel {
  background: var(--color-menu-surface);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 18px;
  max-height: min(84vh, 860px);
  max-width: 920px;
  padding: clamp(22px, 3vw, 34px);
  width: min(100%, 920px);
}

.lesson-reference-dialog__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.lesson-reference-dialog__eyebrow {
  color: var(--color-text-muted);
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.lesson-reference-dialog h2 {
  color: var(--color-primary);
  font-size: clamp(1.45rem, 3vw, 2rem);
  line-height: 1.1;
  margin: 0;
}

.lesson-reference-dialog__close {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.lesson-reference-dialog__close:hover {
  background: var(--color-surface-highest);
  color: var(--color-primary);
}

.lesson-reference-dialog__meta {
  display: flex;
}

.lesson-reference-dialog__body {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  max-height: min(54vh, 560px);
  overflow: auto;
  padding: clamp(20px, 3vw, 30px);
}

.lesson-reference-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 640px) {
  .lesson-reference-dialog {
    padding: 14px;
  }

  .lesson-reference-dialog__panel {
    max-height: 92vh;
  }
}
</style>
