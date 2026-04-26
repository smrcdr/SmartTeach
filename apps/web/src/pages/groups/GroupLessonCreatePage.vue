<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { createLesson, type CreateLessonPayload } from '@/features/groups/api/groups.api'
import GroupAdminOnly from '@/features/groups/components/GroupAdminOnly.vue'
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
const isSubmitting = ref(false)
const form = reactive({
  title: '',
  content: '',
  status: 'DRAFT' as CreateLessonPayload['status'],
  startsAt: '',
  endsAt: ''
})

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : undefined
}

function validateForm() {
  if (form.title.trim().length < 2) {
    notifications.error('Название урока должно быть не короче 2 символов')
    return false
  }

  if (!form.startsAt && form.endsAt) {
    notifications.error('Укажите начало урока перед окончанием')
    return false
  }

  if (form.startsAt && form.endsAt && new Date(form.startsAt).getTime() > new Date(form.endsAt).getTime()) {
    notifications.error('Окончание урока должно быть позже начала')
    return false
  }

  return true
}

function buildPayload(): CreateLessonPayload {
  const content = form.content.trim()

  return {
    title: form.title.trim(),
    ...(content ? { content } : {}),
    status: form.status,
    ...(form.startsAt ? { startsAt: toIsoDateTime(form.startsAt) } : {}),
    ...(form.endsAt ? { endsAt: toIsoDateTime(form.endsAt) } : {})
  }
}

async function submit() {
  if (!groupId.value || !auth.accessToken || isSubmitting.value || !validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    await createLesson(groupId.value, buildPayload(), auth.accessToken)
    notifications.success('Урок создан')
    await router.push({ name: 'group-lessons', params: { groupId: groupId.value } })
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
      <AppPageHeader eyebrow="Урок" title="Новый урок" description="Создайте материал, который сразу сохранится в API." />

      <form class="resource-form surface-panel" novalidate @submit.prevent="submit">
        <AppTextField v-model="form.title" name="title" label="Тема урока" placeholder="Введите тему" />
        <AppTextarea v-model="form.content" name="content" label="Материал" placeholder="Добавьте содержание урока" />

        <div class="resource-form__grid">
          <label class="resource-field">
            <span>Статус</span>
            <select v-model="form.status" name="status">
              <option value="DRAFT">Черновик</option>
              <option value="PUBLISHED">Опубликован</option>
            </select>
          </label>
          <AppTextField v-model="form.startsAt" name="startsAt" label="Начало" type="datetime-local" />
          <AppTextField v-model="form.endsAt" name="endsAt" label="Окончание" type="datetime-local" />
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
