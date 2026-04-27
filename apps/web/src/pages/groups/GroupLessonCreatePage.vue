<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createLesson,
  listMaterials,
  type CreateLessonPayload
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
const { items: materials } = useGroupRouteList(listMaterials)
const isSubmitting = ref(false)
const form = reactive({
  title: '',
  materialSubsectionId: '',
  content: '',
  status: 'DRAFT' as CreateLessonPayload['status']
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
  [subsectionOptions, () => route.query.materialSubsectionId],
  () => {
    const querySubsectionId = String(route.query.materialSubsectionId ?? '')

    if (
      querySubsectionId &&
      subsectionOptions.value.some((subsection) => subsection.id === querySubsectionId)
    ) {
      form.materialSubsectionId = querySubsectionId
      return
    }

    if (!form.materialSubsectionId && subsectionOptions.value.length > 0) {
      form.materialSubsectionId = subsectionOptions.value[0].id
    }
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

function buildPayload(): CreateLessonPayload {
  const content = form.content.trim()

  return {
    title: form.title.trim(),
    materialSubsectionId: form.materialSubsectionId,
    ...(content ? { content } : {}),
    status: form.status
  }
}

async function submit() {
  if (!groupId.value || !auth.accessToken || isSubmitting.value || !validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    const lesson = await createLesson(groupId.value, buildPayload(), auth.accessToken)
    notifications.success('Урок создан')
    await router.push({
      name: 'group-material-subsection',
      params: {
        groupId: groupId.value,
        subsectionId: lesson.materialSubsectionId ?? form.materialSubsectionId
      }
    })
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось создать урок')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <GroupAdminOnly>
    <main class="page narrow-page">
      <AppPageHeader eyebrow="Материалы" title="Новый урок" description="Создайте урок внутри выбранного подраздела." />

      <form class="resource-form surface-panel" novalidate @submit.prevent="submit">
        <AppTextField v-model="form.title" name="title" label="Тема урока" placeholder="Введите тему" />
        <AppTextarea v-model="form.content" name="content" label="Материал" placeholder="Добавьте содержание урока" />

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
            </select>
          </label>
        </div>

        <div class="resource-form__actions">
          <AppButton type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Создаём...' : 'Создать урок' }}</AppButton>
          <RouterLink :to="{ name: 'group-lessons', params: { groupId } }">Отмена</RouterLink>
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
