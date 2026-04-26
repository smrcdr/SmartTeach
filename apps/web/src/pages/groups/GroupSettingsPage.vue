<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  updateGroup,
  updateGroupSettings,
  type Group,
  type GroupSettings,
  type UpdateGroupPayload
} from '@/features/groups/api/groups.api'
import GroupAccessModeSelect from '@/features/groups/components/GroupAccessModeSelect.vue'
import GroupModuleSwitch from '@/features/groups/components/GroupModuleSwitch.vue'
import { useGroup } from '@/features/groups/composables/useGroup'
import { groupSettingOptions } from '@/features/groups/lib/group-form-options'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

type GroupSettingsForm = {
  name: string
  description: string
  accessMode: Group['accessMode']
  settings: GroupSettings
}

const auth = useAuthStore()
const notifications = useNotificationStore()
const { group, error, isLoading, refresh } = useGroup()
const isSubmitting = ref(false)
const canManage = computed(() => canManageGroup(group.value))
const form = reactive<GroupSettingsForm>({
  name: '',
  description: '',
  accessMode: 'BY_REQUEST',
  settings: {
    chatEnabled: true,
    lessonsEnabled: true,
    assignmentsEnabled: true,
    scheduleEnabled: true
  }
})

function fillForm(nextGroup: Group | null) {
  if (!nextGroup) {
    return
  }

  form.name = nextGroup.name
  form.description = nextGroup.description ?? ''
  form.accessMode = nextGroup.accessMode
  form.settings = { ...nextGroup.settings }
}

function validateForm() {
  if (form.name.trim().length < 2) {
    notifications.error('Название группы должно быть не короче 2 символов')
    return false
  }

  return true
}

async function submit() {
  if (!group.value || !canManage.value || isSubmitting.value || !validateForm()) {
    return
  }

  const groupId = group.value.id
  const groupPayload: UpdateGroupPayload = {
    name: form.name.trim(),
    description: form.description.trim(),
    accessMode: form.accessMode
  }

  isSubmitting.value = true

  try {
    await updateGroup(groupId, groupPayload, auth.accessToken)
    await updateGroupSettings(groupId, { ...form.settings }, auth.accessToken)
    await refresh()
    notifications.success('Настройки группы сохранены')
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось сохранить настройки группы')
  } finally {
    isSubmitting.value = false
  }
}

watch(group, fillForm, { immediate: true })
</script>

<template>
  <main v-if="isLoading" class="page narrow-page">
    <EmptyState title="Загружаем настройки" />
  </main>

  <main v-else-if="error || !group" class="page narrow-page">
    <EmptyState title="Настройки недоступны" :description="error ?? 'Группа не найдена'" />
  </main>

  <main v-else-if="!canManage" class="page narrow-page">
    <EmptyState title="Недостаточно прав" description="Этот раздел доступен владельцу и администраторам группы." />
  </main>

  <main v-else class="page narrow-page">
    <AppPageHeader
      eyebrow="Администрирование"
      title="Настройки группы"
      description="Измените данные группы, доступ и разделы."
    />

    <form class="group-settings-form surface-panel" novalidate @submit.prevent="submit">
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

      <section class="group-settings-form__modules" aria-labelledby="group-settings-modules-title">
        <h2 id="group-settings-modules-title">Разделы</h2>
        <div class="group-settings-form__module-grid">
          <GroupModuleSwitch
            v-for="option in groupSettingOptions"
            :key="option.key"
            v-model="form.settings[option.key]"
            :name="option.key"
            :label="option.label"
          />
        </div>
      </section>

      <div class="group-settings-form__actions">
        <AppButton type="submit" size="lg" :disabled="isSubmitting">
          {{ isSubmitting ? 'Сохраняем...' : 'Сохранить настройки' }}
        </AppButton>
      </div>
    </form>
  </main>
</template>

<style scoped>
.group-settings-form {
  display: grid;
  gap: 20px;
  padding: clamp(24px, 4vw, 36px);
}

.group-settings-form__modules {
  display: grid;
  gap: 14px;
}

.group-settings-form__modules h2 {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.group-settings-form__module-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.group-settings-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
}

@media (max-width: 720px) {
  .group-settings-form__module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
