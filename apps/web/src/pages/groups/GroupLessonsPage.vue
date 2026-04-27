<script setup lang="ts">
import { ChevronDown, FolderPlus, Plus, X } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createMaterialSection,
  createMaterialSubsection,
  listMaterials,
  type MaterialSection
} from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const route = useRoute()
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
const dialogSection = ref<MaterialSection | null>(null)
const form = reactive({
  title: ''
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

function openSectionDialog() {
  dialogMode.value = 'section'
  dialogSection.value = null
  form.title = ''
  isDialogOpen.value = true
}

function openSubsectionDialog(section: MaterialSection) {
  dialogMode.value = 'subsection'
  dialogSection.value = section
  form.title = ''
  isDialogOpen.value = true
}

function closeDialog() {
  if (isSubmitting.value) {
    return
  }

  isDialogOpen.value = false
  form.title = ''
  dialogSection.value = null
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
    if (dialogMode.value === 'section') {
      const section = await createMaterialSection(groupId.value, { title }, auth.accessToken)
      expandedSectionIds.value = new Set([...expandedSectionIds.value, section.id])
      notifications.success('Раздел создан')
    } else if (dialogSection.value) {
      await createMaterialSubsection(groupId.value, dialogSection.value.id, { title }, auth.accessToken)
      expandedSectionIds.value = new Set([...expandedSectionIds.value, dialogSection.value.id])
      notifications.success('Подраздел создан')
    }

    await refresh()
    closeDialog()
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось сохранить материалы')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="page">
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
          <button class="material-section__header" type="button" @click="toggleSection(section.id)">
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
            <RouterLink
              v-for="(subsection, subsectionIndex) in section.subsections"
              :key="subsection.id"
              class="material-subsection"
              :to="{ name: 'group-material-subsection', params: { groupId, subsectionId: subsection.id } }"
            >
              <span class="material-subsection__number">{{ sectionIndex + 1 }}.{{ subsectionIndex + 1 }}</span>
              <span class="material-subsection__title">{{ subsection.title }}</span>
              <span class="material-subsection__meta">{{ subsection.lessonsCount }} уроков</span>
            </RouterLink>

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
            <h2 id="material-dialog-title">
              {{ dialogMode === 'section' ? 'Новый раздел' : `Подраздел в «${dialogSection?.title ?? ''}»` }}
            </h2>
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

.material-subsection__number {
  color: var(--color-primary);
  font-size: 0.92rem;
  font-weight: 900;
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
