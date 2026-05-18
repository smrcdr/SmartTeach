<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createAssignment,
  listMaterials,
  listLessons,
  type CreateAssignmentPayload
} from '@/features/groups/api/groups.api'
import GroupAdminOnly from '@/features/groups/components/GroupAdminOnly.vue'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'

type TargetKind = 'materialSectionIds' | 'materialSubsectionIds' | 'lessonIds'

type TargetOption = {
  id: string
  title: string
  number: string
  searchText: string
}

const auth = useAuthStore()
const notifications = useNotificationStore()
const route = useRoute()
const router = useRouter()
const groupId = computed(() => String(route.params.groupId ?? ''))
const { items: lessons } = useGroupRouteList(listLessons)
const { items: materials } = useGroupRouteList(listMaterials)
const isSubmitting = ref(false)
const form = reactive({
  title: '',
  content: '',
  status: 'DRAFT' as CreateAssignmentPayload['status'],
  dueAt: '',
  maxScore: ''
})
const selectedTargets = reactive({
  lessonIds: [] as string[],
  materialSectionIds: [] as string[],
  materialSubsectionIds: [] as string[]
})
const targetSearch = reactive<Record<TargetKind, string>>({
  materialSectionIds: '',
  materialSubsectionIds: '',
  lessonIds: ''
})
const focusedTarget = ref<TargetKind | null>(null)
const sectionOptions = computed<TargetOption[]>(() => {
  return materials.value.map((section, sectionIndex) => ({
    id: section.id,
    title: section.title,
    number: String(sectionIndex + 1),
    searchText: `${sectionIndex + 1} ${section.title}`
  }))
})
const subsectionOptions = computed<TargetOption[]>(() => {
  return materials.value.flatMap((section, sectionIndex) =>
    section.subsections.map((subsection, subsectionIndex) => ({
      id: subsection.id,
      title: subsection.title,
      number: `${sectionIndex + 1}.${subsectionIndex + 1}`,
      searchText: `${sectionIndex + 1}.${subsectionIndex + 1} ${section.title} ${subsection.title}`
    }))
  )
})
const lessonOptions = computed<TargetOption[]>(() => {
  return lessons.value.map((lesson, lessonIndex) => ({
    id: lesson.id,
    title: lesson.title,
    number: String(lesson.sortOrder || lessonIndex + 1),
    searchText: `${lesson.sortOrder || lessonIndex + 1} ${lesson.title}`
  }))
})
const targetGroups = computed(() => [
  {
    key: 'materialSectionIds' as const,
    title: 'Разделы',
    placeholder: 'Найти раздел',
    emptyText: 'Разделов пока нет',
    selectedEmptyText: 'Разделы не выбраны',
    options: sectionOptions.value
  },
  {
    key: 'materialSubsectionIds' as const,
    title: 'Подразделы',
    placeholder: 'Найти подраздел',
    emptyText: 'Подразделов пока нет',
    selectedEmptyText: 'Подразделы не выбраны',
    options: subsectionOptions.value
  },
  {
    key: 'lessonIds' as const,
    title: 'Уроки',
    placeholder: 'Найти урок',
    emptyText: 'Уроков пока нет',
    selectedEmptyText: 'Уроки не выбраны',
    options: lessonOptions.value
  }
])

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : undefined
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU')
}

function getSearchScore(option: TargetOption, query: string) {
  if (!query) {
    return 0
  }

  const title = option.searchText.toLocaleLowerCase('ru-RU')
  const index = title.indexOf(query)

  if (index >= 0) {
    return index
  }

  return query.split(/\s+/).reduce((score, part) => (
    title.includes(part) ? score : score + 20
  ), 10)
}

function getAvailableOptions(key: TargetKind, options: TargetOption[]) {
  const selectedIds = new Set(selectedTargets[key])
  const query = normalizeSearch(targetSearch[key])

  return options
    .filter((option) => !selectedIds.has(option.id))
    .map((option, index) => ({
      option,
      score: getSearchScore(option, query),
      index
    }))
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .slice(0, 5)
    .map(({ option }) => option)
}

function getSelectedOptions(key: TargetKind, options: TargetOption[]) {
  const optionById = new Map(options.map((option) => [option.id, option]))

  return selectedTargets[key]
    .map((id) => optionById.get(id))
    .filter((option): option is TargetOption => Boolean(option))
}

function addTarget(key: TargetKind, option: TargetOption) {
  if (!selectedTargets[key].includes(option.id)) {
    selectedTargets[key].push(option.id)
  }

  targetSearch[key] = ''
  focusedTarget.value = null

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

function removeTarget(key: TargetKind, optionId: string) {
  const targetIndex = selectedTargets[key].indexOf(optionId)

  if (targetIndex >= 0) {
    selectedTargets[key].splice(targetIndex, 1)
  }
}

function validateForm() {
  if (form.title.trim().length < 2) {
    notifications.error('Название задания должно быть не короче 2 символов')
    return false
  }

  if (form.maxScore && Number(form.maxScore) < 0) {
    notifications.error('Максимальный балл не может быть отрицательным')
    return false
  }

  return true
}

function buildPayload(): CreateAssignmentPayload {
  const content = form.content.trim()

  return {
    title: form.title.trim(),
    ...(content ? { content } : {}),
    status: form.status,
    ...(selectedTargets.materialSectionIds.length > 0
      ? { materialSectionIds: [...selectedTargets.materialSectionIds] }
      : {}),
    ...(selectedTargets.materialSubsectionIds.length > 0
      ? { materialSubsectionIds: [...selectedTargets.materialSubsectionIds] }
      : {}),
    ...(selectedTargets.lessonIds.length > 0
      ? { lessonIds: [...selectedTargets.lessonIds] }
      : {}),
    ...(form.dueAt ? { dueAt: toIsoDateTime(form.dueAt) } : {}),
    ...(form.maxScore ? { maxScore: Number(form.maxScore) } : {})
  }
}

async function submit() {
  if (!groupId.value || !auth.accessToken || isSubmitting.value || !validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    await createAssignment(groupId.value, buildPayload(), auth.accessToken)
    notifications.success('Задание создано')
    await router.push({ name: 'group-assignments', params: { groupId: groupId.value } })
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось создать задание')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <GroupAdminOnly>
    <main class="page narrow-page">
      <AppPageHeader eyebrow="Задание" title="Новое задание" description="Сформулируйте задачу и сохраните её в API." />

      <form class="resource-form surface-panel" novalidate @submit.prevent="submit">
        <AppTextField v-model="form.title" name="title" label="Название задания" placeholder="Введите название" />
        <AppTextarea v-model="form.content" name="content" label="Условие" placeholder="Опишите задачу" />

        <div class="resource-form__grid">
          <label class="resource-field">
            <span>Статус</span>
            <select v-model="form.status" name="status">
              <option value="DRAFT">Черновик</option>
              <option value="PUBLISHED">Опубликовано</option>
            </select>
          </label>
          <AppTextField v-model="form.dueAt" name="dueAt" label="Дедлайн" type="datetime-local" />
          <AppTextField v-model="form.maxScore" name="maxScore" label="Макс. балл" type="number" />
        </div>

        <section class="target-picker">
          <header>
            <span>Связанные материалы</span>
            <p>Можно выбрать несколько разделов, подразделов и уроков.</p>
          </header>

          <div class="target-picker__stack">
            <section
              v-for="group in targetGroups"
              :key="group.key"
              class="target-group"
            >
              <div class="target-group__header">
                <h3>{{ group.title }}</h3>
                <span>{{ getSelectedOptions(group.key, group.options).length }}</span>
              </div>

              <div class="target-search">
                <input
                  v-model="targetSearch[group.key]"
                  :name="group.key"
                  type="search"
                  autocomplete="off"
                  :placeholder="group.placeholder"
                  @focus="focusedTarget = group.key"
                  @blur="focusedTarget = null"
                />
                <div
                  v-if="focusedTarget === group.key"
                  class="target-search__results"
                  @mousedown.prevent
                >
                  <button
                    v-for="option in getAvailableOptions(group.key, group.options)"
                    :key="option.id"
                    type="button"
                    class="target-search__option"
                    @click="addTarget(group.key, option)"
                  >
                    <span>{{ option.number }}</span>
                    <strong>{{ option.title }}</strong>
                  </button>
                  <p v-if="group.options.length === 0" class="target-group__empty">{{ group.emptyText }}</p>
                  <p v-else-if="getAvailableOptions(group.key, group.options).length === 0" class="target-group__empty">
                    Ничего не найдено
                  </p>
                </div>
              </div>

              <div class="target-selected">
                <button
                  v-for="option in getSelectedOptions(group.key, group.options)"
                  :key="option.id"
                  type="button"
                  class="target-chip"
                  :aria-label="`Убрать ${option.title}`"
                  @click="removeTarget(group.key, option.id)"
                >
                  <span>{{ option.number }}</span>
                  <strong>{{ option.title }}</strong>
                  <span class="target-chip__remove" aria-hidden="true">×</span>
                </button>
                <p
                  v-if="getSelectedOptions(group.key, group.options).length === 0"
                  class="target-group__empty"
                >
                  {{ group.selectedEmptyText }}
                </p>
              </div>
            </section>
          </div>
        </section>

        <div class="resource-form__actions">
          <AppButton type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Создаём...' : 'Создать задание' }}</AppButton>
          <RouterLink :to="{ name: 'group-assignments', params: { groupId } }">Отмена</RouterLink>
        </div>
      </form>
    </main>
  </GroupAdminOnly>
</template>

<style scoped>
.resource-form {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 36px);
}

.resource-form__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.resource-field {
  display: grid;
  gap: 8px;
}

.resource-field--wide {
  grid-column: 1 / -1;
}

.resource-field span {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.resource-field select {
  background: var(--color-surface-low);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text);
  min-height: 48px;
  outline: none;
  padding: 0 16px;
}

.resource-field select:focus {
  background: var(--color-surface-highest);
  border-color: var(--color-focus-border);
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}

.resource-form__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
}

.resource-form__actions a {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 720;
}

.resource-form__actions a:hover {
  color: var(--color-primary);
}

.target-picker {
  border-top: 1px solid var(--color-divider);
  display: grid;
  gap: 16px;
  padding-top: 6px;
}

.target-picker header {
  display: grid;
  gap: 4px;
}

.target-picker header span,
.target-group legend {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.target-picker header p,
.target-group__empty {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.target-picker__stack {
  display: grid;
  gap: 16px;
}

.target-group {
  background: var(--color-surface-low);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-md);
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 16px;
}

.target-group__header {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.target-group__header h3 {
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 850;
  margin: 0;
}

.target-group__header span {
  align-items: center;
  background: var(--color-surface-highest);
  border: 1px solid var(--color-panel-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 800;
  height: 28px;
  justify-content: center;
  min-width: 28px;
  padding: 0 9px;
}

.target-search {
  position: relative;
}

.target-search input {
  background: var(--color-surface-highest);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text);
  min-height: 46px;
  outline: none;
  padding: 0 14px;
  width: 100%;
}

.target-search input:focus {
  border-color: var(--color-focus-border);
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}

.target-search__results {
  background: var(--color-surface-highest);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-floating);
  display: grid;
  gap: 4px;
  left: 0;
  padding: 6px;
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 5;
}

.target-search__option {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  gap: 12px;
  min-height: 42px;
  padding: 8px 10px;
  text-align: left;
}

.target-search__option:hover,
.target-search__option:focus-visible {
  background: var(--color-surface-low);
}

.target-search__option span,
.target-chip span:first-child {
  align-items: center;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  border-radius: 999px;
  color: var(--color-primary);
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 850;
  height: 26px;
  justify-content: center;
  min-width: 26px;
  padding: 0 8px;
}

.target-search__option strong,
.target-chip strong {
  font-size: 0.92rem;
  font-weight: 780;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.target-selected {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 36px;
}

.target-chip {
  align-items: center;
  background: var(--color-surface-highest);
  border: 1px solid var(--color-panel-border);
  border-radius: 999px;
  color: var(--color-text);
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  min-height: 36px;
  min-width: 0;
  padding: 4px 10px 4px 5px;
}

.target-chip:hover,
.target-chip:focus-visible {
  border-color: var(--color-focus-border);
}

.target-chip__remove {
  color: var(--color-text-muted) !important;
  display: inline-flex;
  font-size: 1rem !important;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  padding: 0 !important;
  transition: max-width 0.16s ease, opacity 0.16s ease;
}

.target-chip:hover .target-chip__remove,
.target-chip:focus-visible .target-chip__remove {
  max-width: 14px;
  opacity: 1;
}

@media (max-width: 820px) {
  .resource-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
