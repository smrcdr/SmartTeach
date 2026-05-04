<script setup lang="ts">
import { ArrowLeft, Plus } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  getMaterialSubsection,
  updateLesson,
  type MaterialLesson,
  type MaterialSubsectionDetails
} from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { getLessonStatusLabel } from '@/features/groups/lib/status-labels'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notifications = useNotificationStore()
const { group } = useGroup()
const groupId = computed(() => String(route.params.groupId ?? ''))
const subsectionId = computed(() => String(route.params.subsectionId ?? ''))
const details = ref<MaterialSubsectionDetails | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(false)
const canManage = computed(() => canManageGroup(group.value))
const sectionNumber = computed(() => details.value?.section.sortOrder ?? 1)
const subsectionNumber = computed(() => details.value?.subsection.sortOrder ?? 1)
const lessonContextMenu = ref<{
  lessonId: string
  left: number
  top: number
} | null>(null)
const lessonContextMenuStyle = computed(() => ({
  left: `${lessonContextMenu.value?.left ?? 12}px`,
  top: `${lessonContextMenu.value?.top ?? 12}px`
}))
const draggedLessonId = ref<string | null>(null)
const dragOverLessonId = ref<string | null>(null)
const isLessonPointerDragging = ref(false)

async function refresh() {
  if (!groupId.value || !subsectionId.value || !auth.accessToken) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    details.value = await getMaterialSubsection(groupId.value, subsectionId.value, auth.accessToken)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить подраздел'
  } finally {
    isLoading.value = false
  }
}

watch([groupId, subsectionId, () => auth.accessToken], () => void refresh(), { immediate: true })

function getLessonContextMenuPosition(event: MouseEvent) {
  const viewportPadding = 12
  const menuWidth = 248
  const menuHeight = 56
  const maxLeft = Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding)
  const maxTop = Math.max(viewportPadding, window.innerHeight - menuHeight - viewportPadding)

  return {
    left: Math.min(Math.max(event.clientX, viewportPadding), maxLeft),
    top: Math.min(Math.max(event.clientY + 8, viewportPadding), maxTop)
  }
}

function openLessonContextMenu(lessonId: string, event: MouseEvent) {
  if (!canManage.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  lessonContextMenu.value = {
    lessonId,
    ...getLessonContextMenuPosition(event)
  }
}

function closeLessonContextMenu() {
  lessonContextMenu.value = null
}

async function openLessonEditFromContextMenu() {
  if (!lessonContextMenu.value) {
    return
  }

  const lessonId = lessonContextMenu.value.lessonId

  closeLessonContextMenu()
  await router.push({ name: 'group-lesson-edit', params: { groupId: groupId.value, lessonId } })
}

async function openLesson(lessonId: string) {
  await router.push({ name: 'group-lesson-details', params: { groupId: groupId.value, lessonId } })
}

async function reorderLessons(sourceLessonId: string, targetLessonId: string) {
  if (!details.value || !groupId.value || !auth.accessToken || sourceLessonId === targetLessonId) {
    return
  }

  const sourceIndex = details.value.lessons.findIndex((lesson) => lesson.id === sourceLessonId)
  const targetIndex = details.value.lessons.findIndex((lesson) => lesson.id === targetLessonId)

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return
  }

  const orderedLessons = [...details.value.lessons]
  const [movedLesson] = orderedLessons.splice(sourceIndex, 1)

  orderedLessons.splice(targetIndex, 0, movedLesson)

  details.value = {
    ...details.value,
    lessons: orderedLessons.map((lesson, index) => ({
      ...lesson,
      sortOrder: index + 1
    }))
  }

  try {
    await Promise.all(
      orderedLessons.map((lesson, index) =>
        updateLesson(groupId.value, lesson.id, { sortOrder: index + 1 }, auth.accessToken)
      )
    )
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось изменить порядок уроков')
    await refresh()
  }
}

function getLessonDropTarget(clientX: number, clientY: number) {
  const element = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-lesson-id]')

  if (!element) {
    return null
  }

  return element.dataset.lessonId ?? null
}

function moveLessonPointer(event: PointerEvent) {
  if (!draggedLessonId.value) {
    return
  }

  dragOverLessonId.value = getLessonDropTarget(event.clientX, event.clientY)
}

async function finishLessonPointer(event: PointerEvent) {
  const sourceLessonId = draggedLessonId.value
  const targetLessonId = getLessonDropTarget(event.clientX, event.clientY)

  window.removeEventListener('pointermove', moveLessonPointer)
  window.removeEventListener('pointerup', finishLessonPointer)
  window.removeEventListener('pointercancel', cancelLessonPointer)
  draggedLessonId.value = null
  dragOverLessonId.value = null
  isLessonPointerDragging.value = false

  if (!sourceLessonId || !targetLessonId) {
    return
  }

  await reorderLessons(sourceLessonId, targetLessonId)
}

function cancelLessonPointer() {
  window.removeEventListener('pointermove', moveLessonPointer)
  window.removeEventListener('pointerup', finishLessonPointer)
  window.removeEventListener('pointercancel', cancelLessonPointer)
  draggedLessonId.value = null
  dragOverLessonId.value = null
  isLessonPointerDragging.value = false
}

function startLessonPointer(lesson: MaterialLesson, event: PointerEvent) {
  if (!canManage.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  draggedLessonId.value = lesson.id
  dragOverLessonId.value = lesson.id
  isLessonPointerDragging.value = true
  window.addEventListener('pointermove', moveLessonPointer)
  window.addEventListener('pointerup', finishLessonPointer)
  window.addEventListener('pointercancel', cancelLessonPointer)
}

function enterLessonDropTarget(lesson: MaterialLesson) {
  if (!draggedLessonId.value) {
    return
  }

  dragOverLessonId.value = lesson.id
}

async function dropLesson(lesson: MaterialLesson) {
  const sourceLessonId = draggedLessonId.value

  draggedLessonId.value = null
  dragOverLessonId.value = null

  if (!sourceLessonId) {
    return
  }

  await reorderLessons(sourceLessonId, lesson.id)
}

function finishLessonDrag() {
  draggedLessonId.value = null
  dragOverLessonId.value = null
}

onBeforeUnmount(() => {
  cancelLessonPointer()
})
</script>

<template>
  <main v-if="details" class="page" @click="closeLessonContextMenu">
    <AppPageHeader
      eyebrow="Материалы"
      :title="details.subsection.title"
      :description="`${details.section.title} · ${sectionNumber}.${subsectionNumber}`"
      align="split"
    >
      <template #actions>
        <RouterLink :to="{ name: 'group-lessons', params: { groupId }, query: { sectionId: details.section.id } }">
          <AppButton variant="secondary">
            <ArrowLeft :size="18" />
            К разделам
          </AppButton>
        </RouterLink>
        <RouterLink
          v-if="canManage"
          :to="{
            name: 'group-lesson-create',
            params: { groupId },
            query: { materialSubsectionId: details.subsection.id }
          }"
        >
          <AppButton>
            <Plus :size="18" />
            Добавить урок
          </AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <section class="subsection-panel">
      <article class="subsection-block">
        <div class="subsection-block__header">
          <span class="subsection-block__number">{{ sectionNumber }}.{{ subsectionNumber }}</span>
          <div>
            <h2>{{ details.subsection.title }}</h2>
            <p>{{ details.lessons.length }} уроков внутри подраздела</p>
          </div>
        </div>

        <div v-if="details.lessons.length > 0" class="lesson-list">
          <div
            v-for="(lesson, lessonIndex) in details.lessons"
            :key="lesson.id"
            :class="[
              'lesson-row',
              draggedLessonId === lesson.id && 'lesson-row--dragging',
              dragOverLessonId === lesson.id && 'lesson-row--drag-over'
            ]"
            :data-lesson-id="lesson.id"
            role="link"
            tabindex="0"
            @contextmenu="openLessonContextMenu(lesson.id, $event)"
            @click="!isLessonPointerDragging && openLesson(lesson.id)"
            @keydown.enter.prevent="openLesson(lesson.id)"
            @keydown.space.prevent="openLesson(lesson.id)"
            @dragover.prevent="enterLessonDropTarget(lesson)"
            @drop.prevent="dropLesson(lesson)"
          >
            <span
              :class="[
                'lesson-row__number',
                'lesson-row__drag-handle',
                canManage && 'lesson-row__drag-handle--enabled'
              ]"
              :aria-label="`Перетащить урок ${lesson.title}`"
              @pointerdown="startLessonPointer(lesson, $event)"
              @click.stop
            >
              {{ sectionNumber }}.{{ subsectionNumber }}.{{ lessonIndex + 1 }}
            </span>
            <span class="lesson-row__title">{{ lesson.title }}</span>
            <StatusPill
              v-if="canManage"
              :label="getLessonStatusLabel(lesson.status)"
              :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'"
            />
          </div>
        </div>

        <EmptyState
          v-else
          title="Уроков пока нет"
          description="Администратор может добавить урок в этот подраздел."
        />
      </article>
    </section>

    <section
      v-if="lessonContextMenu"
      class="lesson-context-menu"
      role="menu"
      :style="lessonContextMenuStyle"
      @click.stop
    >
      <button type="button" role="menuitem" @click="openLessonEditFromContextMenu">
        <span class="lesson-context-menu__icon" data-icon-id="edit" aria-hidden="true">edit</span>
        Редактировать
      </button>
    </section>
  </main>

  <main v-else class="page">
    <EmptyState
      :title="isLoading ? 'Загружаем подраздел' : 'Подраздел не загружен'"
      :description="error ?? 'Данные подраздела ожидаются от API.'"
    />
  </main>
</template>

<style scoped>
.subsection-panel {
  display: grid;
  gap: 16px;
}

.subsection-block {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 18px;
  padding: clamp(20px, 4vw, 30px);
}

.subsection-block__header {
  align-items: center;
  border-bottom: 1px solid var(--color-divider);
  display: flex;
  gap: 18px;
  padding-bottom: 18px;
}

.subsection-block__number {
  align-items: center;
  background: var(--color-primary-container);
  border-radius: var(--radius-sm);
  color: var(--color-action-primary-text);
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 1.05rem;
  font-weight: 900;
  height: 52px;
  justify-content: center;
  min-width: 70px;
  padding: 0 12px;
}

.subsection-block h2,
.subsection-block p {
  margin: 0;
}

.subsection-block h2 {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.subsection-block p {
  color: var(--color-text-muted);
  margin-top: 6px;
}

.lesson-list {
  display: grid;
  gap: 10px;
}

.lesson-context-menu {
  background: var(--color-menu-surface);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 4px;
  min-width: 236px;
  padding: 10px;
  position: fixed;
  width: min(248px, calc(100vw - 24px));
  z-index: 40;
}

.lesson-context-menu button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 650;
  gap: 10px;
  min-height: 42px;
  padding: 0 14px;
  text-align: left;
}

.lesson-context-menu button:hover,
.lesson-context-menu button:focus-visible {
  background: var(--color-menu-hover);
  color: var(--color-primary);
  outline: none;
}

.lesson-context-menu__icon {
  font-family: 'Material Symbols Outlined';
  font-size: 19px;
  font-style: normal;
  font-weight: 400;
  line-height: 1;
}

.lesson-row {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: grid;
  gap: 14px;
  grid-template-columns: 82px minmax(0, 1fr) auto;
  min-height: 62px;
  padding: 13px 16px;
}

.lesson-row:hover {
  background: var(--color-surface-high);
  border-color: var(--color-focus-border);
}

.lesson-row--drag-over {
  background: var(--color-surface-high);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.lesson-row--dragging {
  opacity: 0.72;
}

.lesson-row__number {
  align-items: center;
  color: var(--color-primary);
  display: inline-flex;
  font-weight: 900;
  min-height: 34px;
}

.lesson-row__drag-handle--enabled {
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.lesson-row__drag-handle--enabled:active {
  cursor: grabbing;
}

.lesson-row__title {
  font-weight: 790;
  min-width: 0;
}

@media (max-width: 640px) {
  .subsection-block__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .lesson-row {
    align-items: flex-start;
    grid-template-columns: 1fr;
  }
}
</style>
