<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createGroup,
  type CreateGroupPayload,
  type GroupSettings
} from '@/features/groups/api/groups.api'
import GroupAccessModeSelect from '@/features/groups/components/GroupAccessModeSelect.vue'
import GroupModuleSwitch from '@/features/groups/components/GroupModuleSwitch.vue'
import { groupSettingOptions } from '@/features/groups/lib/group-form-options'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'

type CreateGroupForm = {
  name: string
  description: string
  accessMode: CreateGroupPayload['accessMode']
  settings: GroupSettings
}

const auth = useAuthStore()
const notifications = useNotificationStore()
const router = useRouter()
const isSubmitting = ref(false)
const form = reactive<CreateGroupForm>({
  name: '',
  description: '',
  accessMode: 'BY_REQUEST',
  settings: {
    chatEnabled: true,
    lessonsEnabled: true,
    assignmentsEnabled: true,
    scheduleEnabled: true
  } satisfies GroupSettings
})

function buildPayload(): CreateGroupPayload {
  const description = form.description.trim()

  return {
    name: form.name.trim(),
    ...(description ? { description } : {}),
    accessMode: form.accessMode,
    settings: { ...form.settings }
  }
}

function validateForm() {
  if (form.name.trim().length < 2) {
    notifications.error('Название группы должно быть не короче 2 символов')
    return false
  }

  return true
}

async function submit() {
  if (isSubmitting.value || !validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    const group = await createGroup(buildPayload(), auth.accessToken)
    notifications.success('Группа создана')
    await router.push({ name: 'group-workspace', params: { groupId: group.id } })
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось создать группу')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader
      eyebrow="Новая группа"
      title="Создать группу"
      description="Укажите данные группы и доступные разделы."
    />

    <form class="create-group-form surface-panel" novalidate @submit.prevent="submit">
      <AppTextField
        v-model="form.name"
        name="name"
        label="Имя"
        placeholder="Введите имя группы"
      />
      <AppTextarea
        v-model="form.description"
        name="description"
        label="Описание"
        placeholder="Добавьте описание"
      />
      <GroupAccessModeSelect v-model="form.accessMode" name="accessMode" />

      <section class="create-group-form__modules" aria-labelledby="group-modules-title">
        <h2 id="group-modules-title">Разделы</h2>
        <div class="create-group-form__module-grid">
          <GroupModuleSwitch
            v-for="option in groupSettingOptions"
            :key="option.key"
            v-model="form.settings[option.key]"
            :name="option.key"
            :label="option.label"
          />
        </div>
      </section>

      <div class="create-group-form__actions">
        <AppButton type="submit" size="lg" :disabled="isSubmitting">
          {{ isSubmitting ? 'Создаём...' : 'Создать группу' }}
        </AppButton>
        <RouterLink to="/my-groups" class="create-group-form__cancel">Отмена</RouterLink>
      </div>
    </form>
  </main>
</template>

<style scoped>
.create-group-form {
  display: grid;
  gap: 20px;
  padding: clamp(24px, 4vw, 36px);
}

.create-group-form__modules {
  display: grid;
  gap: 14px;
}

.create-group-form__modules h2 {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.create-group-form__module-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.create-group-form__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
}

.create-group-form__cancel {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 720;
}

.create-group-form__cancel:hover {
  color: var(--color-primary);
}

@media (max-width: 720px) {
  .create-group-form__module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
