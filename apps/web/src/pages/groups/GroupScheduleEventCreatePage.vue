<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { createScheduleEvent, type CreateScheduleEventPayload } from '@/features/groups/api/groups.api'
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
  description: '',
  startsAt: '',
  endsAt: '',
  location: ''
})

function toIsoDateTime(value: string) {
  return new Date(value).toISOString()
}

function validateForm() {
  if (form.title.trim().length < 2) {
    notifications.error('Название события должно быть не короче 2 символов')
    return false
  }

  if (!form.startsAt || !form.endsAt) {
    notifications.error('Укажите начало и окончание события')
    return false
  }

  if (new Date(form.startsAt).getTime() >= new Date(form.endsAt).getTime()) {
    notifications.error('Окончание события должно быть позже начала')
    return false
  }

  return true
}

function buildPayload(): CreateScheduleEventPayload {
  const description = form.description.trim()
  const location = form.location.trim()

  return {
    title: form.title.trim(),
    ...(description ? { description } : {}),
    startsAt: toIsoDateTime(form.startsAt),
    endsAt: toIsoDateTime(form.endsAt),
    ...(location ? { location } : {})
  }
}

async function submit() {
  if (!groupId.value || !auth.accessToken || isSubmitting.value || !validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    await createScheduleEvent(groupId.value, buildPayload(), auth.accessToken)
    notifications.success('Событие создано')
    await router.push({ name: 'group-schedule', params: { groupId: groupId.value } })
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось создать событие')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <GroupAdminOnly>
    <main class="page narrow-page">
      <AppPageHeader eyebrow="Календарь" title="Новое событие" description="Добавьте встречу или занятие в расписание группы." />

      <form class="resource-form surface-panel" novalidate @submit.prevent="submit">
        <AppTextField v-model="form.title" name="title" label="Название события" placeholder="Введите название" />
        <AppTextarea v-model="form.description" name="description" label="Описание" placeholder="Добавьте детали" />

        <div class="resource-form__grid">
          <AppTextField v-model="form.startsAt" name="startsAt" label="Начало" type="datetime-local" />
          <AppTextField v-model="form.endsAt" name="endsAt" label="Окончание" type="datetime-local" />
          <AppTextField v-model="form.location" name="location" label="Место" placeholder="Кабинет, ссылка или адрес" />
        </div>

        <div class="resource-form__actions">
          <AppButton type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Создаём...' : 'Добавить событие' }}</AppButton>
          <RouterLink :to="{ name: 'group-schedule', params: { groupId } }">Отмена</RouterLink>
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
