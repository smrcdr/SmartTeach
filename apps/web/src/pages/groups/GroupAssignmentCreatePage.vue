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
  targetType: 'none' as 'none' | 'section' | 'subsection' | 'lesson',
  targetId: '',
  dueAt: '',
  maxScore: ''
})
const targetOptions = computed(() => {
  if (form.targetType === 'section') {
    return materials.value.map((section, index) => ({
      id: section.id,
      label: `${index + 1} ${section.title}`
    }))
  }

  if (form.targetType === 'subsection') {
    return materials.value.flatMap((section, sectionIndex) =>
      section.subsections.map((subsection, subsectionIndex) => ({
        id: subsection.id,
        label: `${sectionIndex + 1}.${subsectionIndex + 1} ${subsection.title}`
      }))
    )
  }

  if (form.targetType === 'lesson') {
    return lessons.value.map((lesson) => ({
      id: lesson.id,
      label: lesson.title
    }))
  }

  return []
})

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : undefined
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

  if (form.targetType !== 'none' && !form.targetId) {
    notifications.error('Выберите раздел, подраздел или урок для привязки')
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
    ...(form.targetType === 'section' ? { materialSectionId: form.targetId } : {}),
    ...(form.targetType === 'subsection' ? { materialSubsectionId: form.targetId } : {}),
    ...(form.targetType === 'lesson' ? { lessonId: form.targetId } : {}),
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
          <label class="resource-field">
            <span>Привязка</span>
            <select v-model="form.targetType" name="targetType" @change="form.targetId = ''">
              <option value="none">Без привязки</option>
              <option value="section">К разделу</option>
              <option value="subsection">К подразделу</option>
              <option value="lesson">К уроку</option>
            </select>
          </label>
          <label v-if="form.targetType !== 'none'" class="resource-field resource-field--wide">
            <span>Материал</span>
            <select v-model="form.targetId" name="targetId">
              <option value="" disabled>Выберите материал</option>
              <option v-for="target in targetOptions" :key="target.id" :value="target.id">{{ target.label }}</option>
            </select>
          </label>
          <AppTextField v-model="form.dueAt" name="dueAt" label="Дедлайн" type="datetime-local" />
          <AppTextField v-model="form.maxScore" name="maxScore" label="Макс. балл" type="number" />
        </div>

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

@media (max-width: 820px) {
  .resource-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
