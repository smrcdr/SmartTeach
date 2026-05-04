<script setup lang="ts">
import { ChevronDown, FolderPlus, Plus, X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createMaterialSection,
  createMaterialSubsection,
  listMaterials,
  updateMaterialSection,
  updateMaterialSubsection,
  type MaterialSection,
  type MaterialSubsection
} from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notifications = useNotificationStore()
const { group } = useGroup()
const groupId = computed(() => String(route.params.groupId ?? ''))
const canManage = computed(() => canManageGroup(group.value))
const materials = ref<MaterialSection[]>([])
const expandedSectionIds = ref(new Set<string>())
const isLoading = ref(false)
const error = ref<string | null>(null)
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const dialogMode = ref<'section' | 'subsection'>('section')
const dialogAction = ref<'create' | 'edit'>('create')
const dialogSection = ref<MaterialSection | null>(null)
const dialogSubsection = ref<MaterialSubsection | null>(null)
const contextMenu = ref<{
  type: 'section' | 'subsection'
  section: MaterialSection
  subsection?: MaterialSubsection
  left: number
  top: number
} | null>(null)
const draggedSubsection = ref<{
  sectionId: string
  subsectionId: string
} | null>(null)
const dragOverSubsectionId = ref<string | null>(null)
const isSubsectionPointerDragging = ref(false)
const form = reactive({
  title: ''
})
const contextMenuStyle = computed(() => ({
  left: `${contextMenu.value?.left ?? 12}px`,
  top: `${contextMenu.value?.top ?? 12}px`
}))
const materialDialogTitle = computed(() => {
  if (dialogAction.value === 'edit') {
    return dialogMode.value === 'section' ? 'Редактировать раздел' : 'Редактировать подраздел'
  }

  return dialogMode.value === 'section' ? 'Новый раздел' : `Подраздел в «${dialogSection.value?.title ?? ''}»`
})

async function refresh() {
  if (!groupId.value || !auth.accessToken) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    materials.value = await listMaterials(groupId.value, auth.accessToken)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить материалы'
  } finally {
    isLoading.value = false
  }
}

watch([groupId, () => auth.accessToken], () => void refresh(), { immediate: true })

watch(
  [materials, () => route.query.sectionId],
  () => {
    const sectionId = String(route.query.sectionId ?? '')

    if (!sectionId || !materials.value.some((section) => section.id === sectionId)) {
      return
    }

    expandedSectionIds.value = new Set([...expandedSectionIds.value, sectionId])
  },
  { immediate: true }
)

function isExpanded(sectionId: string) {
  return expandedSectionIds.value.has(sectionId)
}

function toggleSection(sectionId: string) {
  const next = new Set(expandedSectionIds.value)

  if (next.has(sectionId)) {
    next.delete(sectionId)
  } else {
    next.add(sectionId)
  }

  expandedSectionIds.value = next
}

async function openSubsection(subsectionId: string) {
  await router.push({ name: 'group-material-subsection', params: { groupId: groupId.value, subsectionId } })
}

function openSectionDialog() {
  dialogMode.value = 'section'
  dialogAction.value = 'create'
  dialogSection.value = null
  dialogSubsection.value = null
  form.title = ''
  isDialogOpen.value = true
}

function openSubsectionDialog(section: MaterialSection) {
  dialogMode.value = 'subsection'
  dialogAction.value = 'create'
  dialogSection.value = section
  dialogSubsection.value = null
  form.title = ''
  isDialogOpen.value = true
}

function getContextMenuPosition(event: MouseEvent) {
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

function openMaterialContextMenu(
  type: 'section' | 'subsection',
  section: MaterialSection,
  event: MouseEvent,
  subsection?: MaterialSubsection
) {
  if (!canManage.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  contextMenu.value = {
    type,
    section,
    subsection,
    ...getContextMenuPosition(event)
  }
}

function closeContextMenu() {
  contextMenu.value = null
}

function openEditDialogFromContextMenu() {
  if (!contextMenu.value) {
    return
  }

  dialogMode.value = contextMenu.value.type
  dialogAction.value = 'edit'
  dialogSection.value = contextMenu.value.section
  dialogSubsection.value = contextMenu.value.subsection ?? null
  form.title = contextMenu.value.type === 'section'
    ? contextMenu.value.section.title
    : contextMenu.value.subsection?.title ?? ''
  isDialogOpen.value = true
  closeContextMenu()
}

function resetDialog() {
  isDialogOpen.value = false
  form.title = ''
  dialogSection.value = null
  dialogSubsection.value = null
}

function closeDialog() {
  if (isSubmitting.value) {
    return
  }

  resetDialog()
}

async function submitDialog() {
  const title = form.title.trim()

  if (!groupId.value || !auth.accessToken || isSubmitting.value) {
    return
  }

  if (title.length < 2) {
    notifications.error('Название должно быть не короче 2 символов')
    return
  }

  isSubmitting.value = true

  try {
    if (dialogAction.value === 'edit' && dialogMode.value === 'section' && dialogSection.value) {
      await updateMaterialSection(groupId.value, dialogSection.value.id, { title }, auth.accessToken)
      notifications.success('Раздел обновлен')
    } else if (dialogAction.value === 'edit' && dialogMode.value === 'subsection' && dialogSubsection.value) {
      await updateMaterialSubsection(groupId.value, dialogSubsection.value.id, { title }, auth.accessToken)
      notifications.success('Подраздел обновлен')
    } else if (dialogMode.value === 'section') {
      const section = await createMaterialSection(groupId.value, { title }, auth.accessToken)
      expandedSectionIds.value = new Set([...expandedSectionIds.value, section.id])
      notifications.success('Раздел создан')
    } else if (dialogSection.value) {
      await createMaterialSubsection(groupId.value, dialogSection.value.id, { title }, auth.accessToken)
      expandedSectionIds.value = new Set([...expandedSectionIds.value, dialogSection.value.id])
      notifications.success('Подраздел создан')
    }

    resetDialog()
    await refresh()
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось сохранить материалы')
  } finally {
    isSubmitting.value = false
  }
}

async function reorderSubsections(sectionId: string, sourceSubsectionId: string, targetSubsectionId: string) {
  if (!groupId.value || !auth.accessToken || sourceSubsectionId === targetSubsectionId) {
    return
  }

  const section = materials.value.find((currentSection) => currentSection.id === sectionId)

  if (!section) {
    return
  }

  const sourceIndex = section.subsections.findIndex((subsection) => subsection.id === sourceSubsectionId)
  const targetIndex = section.subsections.findIndex((subsection) => subsection.id === targetSubsectionId)

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return
  }

  const orderedSubsections = [...section.subsections]
  const [movedSubsection] = orderedSubsections.splice(sourceIndex, 1)

  orderedSubsections.splice(targetIndex, 0, movedSubsection)

  materials.value = materials.value.map((currentSection) =>
    currentSection.id === sectionId
      ? {
          ...currentSection,
          subsections: orderedSubsections.map((subsection, index) => ({
            ...subsection,
            sortOrder: index + 1
          }))
        }
      : currentSection
  )

  try {
    await Promise.all(
      orderedSubsections.map((subsection, index) =>
        updateMaterialSubsection(groupId.value, subsection.id, { sortOrder: index + 1 }, auth.accessToken)
      )
    )
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось изменить порядок подразделов')
    await refresh()
  }
}

function getSubsectionDropTarget(clientX: number, clientY: number) {
  const element = document
    .elementFromPoint(clientX, clientY)
    ?.closest<HTMLElement>('[data-section-id][data-subsection-id]')

  if (!element) {
    return null
  }

  return {
    sectionId: element.dataset.sectionId ?? '',
    subsectionId: element.dataset.subsectionId ?? ''
  }
}

function moveSubsectionPointer(event: PointerEvent) {
  if (!draggedSubsection.value) {
    return
  }

  const target = getSubsectionDropTarget(event.clientX, event.clientY)

  if (!target || target.sectionId !== draggedSubsection.value.sectionId) {
    dragOverSubsectionId.value = null
    return
  }

  dragOverSubsectionId.value = target.subsectionId
}

async function finishSubsectionPointer(event: PointerEvent) {
  const dragged = draggedSubsection.value
  const target = getSubsectionDropTarget(event.clientX, event.clientY)

  window.removeEventListener('pointermove', moveSubsectionPointer)
  window.removeEventListener('pointerup', finishSubsectionPointer)
  window.removeEventListener('pointercancel', cancelSubsectionPointer)
  draggedSubsection.value = null
  dragOverSubsectionId.value = null
  isSubsectionPointerDragging.value = false

  if (!dragged || !target || dragged.sectionId !== target.sectionId) {
    return
  }

  await reorderSubsections(dragged.sectionId, dragged.subsectionId, target.subsectionId)
}

function cancelSubsectionPointer() {
  window.removeEventListener('pointermove', moveSubsectionPointer)
  window.removeEventListener('pointerup', finishSubsectionPointer)
  window.removeEventListener('pointercancel', cancelSubsectionPointer)
  draggedSubsection.value = null
  dragOverSubsectionId.value = null
  isSubsectionPointerDragging.value = false
}

function startSubsectionPointer(section: MaterialSection, subsection: MaterialSubsection, event: PointerEvent) {
  if (!canManage.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  draggedSubsection.value = {
    sectionId: section.id,
    subsectionId: subsection.id
  }
  dragOverSubsectionId.value = subsection.id
  isSubsectionPointerDragging.value = true
  window.addEventListener('pointermove', moveSubsectionPointer)
  window.addEventListener('pointerup', finishSubsectionPointer)
  window.addEventListener('pointercancel', cancelSubsectionPointer)
}

function enterSubsectionDropTarget(section: MaterialSection, subsection: MaterialSubsection) {
  if (draggedSubsection.value?.sectionId !== section.id) {
    return
  }

  dragOverSubsectionId.value = subsection.id
}

async function dropSubsection(section: MaterialSection, subsection: MaterialSubsection) {
  const dragged = draggedSubsection.value

  draggedSubsection.value = null
  dragOverSubsectionId.value = null

  if (!dragged || dragged.sectionId !== section.id) {
    return
  }

  await reorderSubsections(section.id, dragged.subsectionId, subsection.id)
}

function finishSubsectionDrag() {
  draggedSubsection.value = null
  dragOverSubsectionId.value = null
}

onBeforeUnmount(() => {
  cancelSubsectionPointer()
})
</script>

<template>
  <main class="page" @click="closeContextMenu">
    <AppPageHeader
      eyebrow="Учебная структура"
      title="Материалы"
      description="Разделы, подразделы и уроки группы."
      align="split"
    >
      <template v-if="canManage" #actions>
        <AppButton @click="openSectionDialog">
          <FolderPlus :size="18" />
          Добавить раздел
        </AppButton>
      </template>
    </AppPageHeader>

    <section class="materials-panel">
      <div v-if="materials.length > 0" class="materials-list">
        <article
          v-for="(section, sectionIndex) in materials"
          :key="section.id"
          :id="`section-${section.id}`"
          class="material-section"
        >
          <button
            class="material-section__header"
            type="button"
            @click="toggleSection(section.id)"
            @contextmenu="openMaterialContextMenu('section', section, $event)"
          >
            <span class="material-section__number">{{ sectionIndex + 1 }}</span>
            <span class="material-section__title">{{ section.title }}</span>
            <span class="material-section__meta">{{ section.subsections.length }} подразделов</span>
            <ChevronDown
              class="material-section__chevron"
              :class="{ 'material-section__chevron--open': isExpanded(section.id) }"
              :size="20"
            />
          </button>

          <div v-if="isExpanded(section.id)" class="material-section__body">
            <div
              v-for="(subsection, subsectionIndex) in section.subsections"
              :key="subsection.id"
              :class="[
                'material-subsection',
                draggedSubsection?.subsectionId === subsection.id && 'material-subsection--dragging',
                dragOverSubsectionId === subsection.id && 'material-subsection--drag-over'
              ]"
              :data-section-id="section.id"
              :data-subsection-id="subsection.id"
              role="link"
              tabindex="0"
              @contextmenu="openMaterialContextMenu('subsection', section, $event, subsection)"
              @click="!isSubsectionPointerDragging && openSubsection(subsection.id)"
              @keydown.enter.prevent="openSubsection(subsection.id)"
              @keydown.space.prevent="openSubsection(subsection.id)"
              @dragover.prevent="enterSubsectionDropTarget(section, subsection)"
              @drop.prevent="dropSubsection(section, subsection)"
            >
              <span
                :class="[
                  'material-subsection__number',
                  'material-subsection__drag-handle',
                  canManage && 'material-subsection__drag-handle--enabled'
                ]"
                :aria-label="`Перетащить подраздел ${subsection.title}`"
                @pointerdown="startSubsectionPointer(section, subsection, $event)"
                @click.stop
              >
                {{ sectionIndex + 1 }}.{{ subsectionIndex + 1 }}
              </span>
              <span class="material-subsection__title">{{ subsection.title }}</span>
              <span class="material-subsection__meta">{{ subsection.lessonsCount }} уроков</span>
            </div>

            <button
              v-if="canManage"
              class="material-subsection material-subsection--create"
              type="button"
              @click="openSubsectionDialog(section)"
            >
              <Plus :size="18" />
              Добавить подраздел
            </button>

            <EmptyState
              v-if="section.subsections.length === 0 && !canManage"
              title="Подразделов пока нет"
              description="Администратор еще не добавил подразделы в этот раздел."
            />
          </div>
        </article>
      </div>

      <EmptyState
        v-if="materials.length === 0 && !isLoading && !error"
        title="Материалы пока не созданы"
        description="Сначала добавьте раздел, затем подразделы и уроки внутри них."
      />
      <EmptyState v-if="error" title="Не удалось загрузить материалы" :description="error" />
    </section>

    <section
      v-if="contextMenu"
      class="material-context-menu"
      role="menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <button type="button" role="menuitem" @click="openEditDialogFromContextMenu">
        <span class="material-context-menu__icon" data-icon-id="edit" aria-hidden="true">edit</span>
        Редактировать
      </button>
    </section>

    <div v-if="isDialogOpen" class="material-dialog" @click.self="closeDialog">
      <form
        class="material-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="material-dialog-title"
        @submit.prevent="submitDialog"
      >
        <header class="material-dialog__header">
          <div>
            <span class="eyebrow">{{ dialogMode === 'section' ? 'Раздел' : 'Подраздел' }}</span>
            <h2 id="material-dialog-title">{{ materialDialogTitle }}</h2>
          </div>
          <button class="material-dialog__close" type="button" aria-label="Закрыть" @click="closeDialog">
            <X :size="18" />
          </button>
        </header>

        <AppTextField v-model="form.title" name="title" label="Название" placeholder="Введите название" />

        <div class="material-dialog__actions">
          <AppButton type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Сохраняем...' : 'Сохранить' }}
          </AppButton>
          <AppButton type="button" variant="quiet" :disabled="isSubmitting" @click="closeDialog">
            Отмена
          </AppButton>
        </div>
      </form>
    </div>
  </main>
</template>

<style scoped>
.materials-panel {
  display: grid;
  gap: 16px;
}

.materials-list {
  display: grid;
  gap: 14px;
}

.material-context-menu {
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

.material-context-menu button {
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

.material-context-menu button:hover,
.material-context-menu button:focus-visible {
  background: var(--color-menu-hover);
  color: var(--color-primary);
  outline: none;
}

.material-context-menu__icon {
  font-family: 'Material Symbols Outlined';
  font-size: 19px;
  font-style: normal;
  font-weight: 400;
  line-height: 1;
}

.material-section {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.material-section__header {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--color-text);
  cursor: pointer;
  display: grid;
  gap: 16px;
  grid-template-columns: 58px minmax(0, 1fr) auto 28px;
  min-height: 86px;
  padding: 18px 22px;
  text-align: left;
  width: 100%;
}

.material-section__header:hover {
  background: var(--color-surface-low);
}

.material-section__number {
  align-items: center;
  background: var(--color-primary-container);
  border-radius: var(--radius-sm);
  color: var(--color-action-primary-text);
  display: inline-flex;
  font-size: 1.2rem;
  font-weight: 900;
  height: 48px;
  justify-content: center;
  width: 48px;
}

.material-section__title {
  color: var(--color-primary);
  font-size: 1.2rem;
  font-weight: 850;
  min-width: 0;
}

.material-section__meta,
.material-subsection__meta {
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-weight: 750;
  white-space: nowrap;
}

.material-section__chevron {
  color: var(--color-text-muted);
  transition: transform 160ms ease;
}

.material-section__chevron--open {
  transform: rotate(180deg);
}

.material-section__body {
  border-top: 1px solid var(--color-divider);
  display: grid;
  gap: 10px;
  padding: 14px 22px 22px 96px;
}

.material-subsection {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  color: var(--color-text);
  cursor: pointer;
  display: grid;
  gap: 14px;
  grid-template-columns: 62px minmax(0, 1fr) auto;
  min-height: 58px;
  padding: 12px 16px;
  text-align: left;
}

.material-subsection:hover {
  background: var(--color-surface-high);
  border-color: var(--color-focus-border);
}

.material-subsection--drag-over {
  background: var(--color-surface-high);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.material-subsection--dragging {
  opacity: 0.72;
}

.material-subsection__number {
  align-items: center;
  color: var(--color-primary);
  display: inline-flex;
  font-size: 0.92rem;
  font-weight: 900;
  min-height: 34px;
}

.material-subsection__drag-handle--enabled {
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.material-subsection__drag-handle--enabled:active {
  cursor: grabbing;
}

.material-subsection__title {
  font-weight: 790;
  min-width: 0;
}

.material-subsection--create {
  border-style: dashed;
  cursor: pointer;
  font-weight: 800;
  grid-template-columns: auto 1fr;
}

.material-dialog {
  align-items: center;
  background: rgb(0 0 0 / 38%);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 24px;
  position: fixed;
  z-index: 70;
}

.material-dialog__panel {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 18px;
  max-width: 540px;
  padding: clamp(22px, 4vw, 34px);
  width: min(100%, 540px);
}

.material-dialog__header,
.material-dialog__actions {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
}

.material-dialog__header h2 {
  color: var(--color-primary);
  font-size: 1.35rem;
  margin: 6px 0 0;
}

.material-dialog__close {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: 999px;
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.material-dialog__actions {
  justify-content: flex-start;
}

@media (max-width: 720px) {
  .material-section__header {
    grid-template-columns: 48px minmax(0, 1fr) 24px;
  }

  .material-section__meta {
    grid-column: 2 / 3;
  }

  .material-section__chevron {
    grid-column: 3 / 4;
    grid-row: 1 / 2;
  }

  .material-section__body {
    padding-left: 22px;
  }

  .material-subsection {
    grid-template-columns: 54px minmax(0, 1fr);
  }

  .material-subsection__meta {
    grid-column: 2 / 3;
  }
}
</style>
