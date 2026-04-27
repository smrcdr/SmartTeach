<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  getLesson,
  listMaterials,
  updateLesson,
  type UpdateLessonPayload
} from '@/features/groups/api/groups.api'
import GroupAdminOnly from '@/features/groups/components/GroupAdminOnly.vue'
import MarkdownEditor from '@/features/groups/components/MarkdownEditor.vue'
import { useGroupRouteItem, useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const router = useRouter()
const { item: lesson, groupId, itemId: lessonId, error } = useGroupRouteItem('lessonId', getLesson)
const { items: materials } = useGroupRouteList(listMaterials)
const isSubmitting = ref(false)
const isHydrated = ref(false)
const form = reactive({
  title: '',
  materialSubsectionId: '',
  content: '',
  status: 'DRAFT' as UpdateLessonPayload['status']
})
const subsectionOptions = computed(() =>
  materials.value.flatMap((section, sectionIndex) =>
    section.subsections.map((subsection, subsectionIndex) => ({
      id: subsection.id,
      label: `${sectionIndex + 1}.${subsectionIndex + 1} ${section.title} / ${subsection.title}`
    }))
  )
)

watch(
  lesson,
  (currentLesson) => {
    if (!currentLesson || isHydrated.value) {
      return
    }

    form.title = currentLesson.title
    form.materialSubsectionId = currentLesson.materialSubsectionId ?? ''
    form.content = currentLesson.content ?? ''
    form.status = currentLesson.status
    isHydrated.value = true
  },
  { immediate: true }
)

function validateForm() {
  if (form.title.trim().length < 2) {
    notifications.error('Название урока должно быть не короче 2 символов')
    return false
  }

  if (!form.materialSubsectionId) {
    notifications.error('Выберите подраздел для урока')
    return false
  }

  return true
}

function buildPayload(): UpdateLessonPayload {
  return {
    title: form.title.trim(),
    materialSubsectionId: form.materialSubsectionId,
    content: form.content.trim(),
    status: form.status
  }
}

async function submit() {
  if (!groupId.value || !lessonId.value || !auth.accessToken || isSubmitting.value || !validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    await updateLesson(groupId.value, lessonId.value, buildPayload(), auth.accessToken)
    notifications.success('Урок сохранён')
    await router.push({ name: 'group-lesson-details', params: { groupId: groupId.value, lessonId: lessonId.value } })
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось сохранить урок')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <GroupAdminOnly>
    <main class="page lesson-edit-page">
      <AppPageHeader eyebrow="Урок" title="Редактировать урок" description="Обновите параметры и содержимое материала." />

      <form v-if="lesson" class="lesson-edit-form" novalidate @submit.prevent="submit">
        <section class="resource-form surface-panel">
          <AppTextField v-model="form.title" name="title" label="Тема урока" placeholder="Введите тему" />

          <div class="resource-form__grid">
            <label class="resource-field resource-field--wide">
              <span>Подраздел</span>
              <select v-model="form.materialSubsectionId" name="materialSubsectionId">
                <option value="" disabled>Выберите подраздел</option>
                <option
                  v-for="subsection in subsectionOptions"
                  :key="subsection.id"
                  :value="subsection.id"
                >
                  {{ subsection.label }}
                </option>
              </select>
            </label>
            <label class="resource-field">
              <span>Статус</span>
              <select v-model="form.status" name="status">
                <option value="DRAFT">Черновик</option>
                <option value="PUBLISHED">Опубликован</option>
                <option value="ARCHIVED">Архив</option>
              </select>
            </label>
          </div>
        </section>

        <MarkdownEditor
          v-model="form.content"
          name="content"
          label="Материал"
          :group-id="groupId"
          :token="auth.accessToken"
          placeholder="Обновите конспект, ссылки, списки или блоки кода."
        />

        <div class="resource-form__actions">
          <AppButton type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Сохраняем...' : 'Сохранить урок' }}</AppButton>
          <RouterLink :to="{ name: 'group-lesson-details', params: { groupId, lessonId } }">Отмена</RouterLink>
        </div>
      </form>

      <section v-else class="surface-panel lesson-edit-empty">
        {{ error ?? 'Загружаем урок.' }}
      </section>
    </main>
  </GroupAdminOnly>
</template>

<style scoped>
.lesson-edit-page {
  max-width: 1440px;
}

.lesson-edit-form {
  display: grid;
  gap: 18px;
}

.resource-form {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 36px);
}

.resource-form__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.resource-field--wide {
  grid-column: 1 / -1;
}

.resource-field {
  display: grid;
  gap: 8px;
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
  margin-top: 2px;
}

.resource-form__actions a {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 720;
}

.resource-form__actions a:hover {
  color: var(--color-primary);
}

.lesson-edit-empty {
  color: var(--color-text-muted);
  padding: clamp(24px, 4vw, 36px);
}

@media (max-width: 820px) {
  .resource-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
