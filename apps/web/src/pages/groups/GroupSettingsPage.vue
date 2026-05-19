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
import { uploadFile } from '@/shared/api/files.api'
import GroupAccessModeSelect from '@/features/groups/components/GroupAccessModeSelect.vue'
import GroupImagesSection from '@/features/groups/components/GroupImagesSection.vue'
import GroupSettingsModulesSection from '@/features/groups/components/GroupSettingsModulesSection.vue'
import { useImagePreviewField } from '@/features/groups/composables/useImagePreviewField'
import { useGroup } from '@/features/groups/composables/useGroup'
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
const {
  file: avatarFile,
  previewUrl: avatarPreviewUrl,
  setFile: setAvatarFile,
  setPreviewUrl: setAvatarPreviewUrl
} = useImagePreviewField()
const {
  file: catalogImageFile,
  previewUrl: catalogImagePreviewUrl,
  setFile: setCatalogImageFile,
  setPreviewUrl: setCatalogImagePreviewUrl
} = useImagePreviewField()
const currentAvatarFileId = ref<string | null>(null)
const currentCatalogImageFileId = ref<string | null>(null)
const avatarTouched = ref(false)
const catalogImageTouched = ref(false)
const canManage = computed(() => canManageGroup(group.value))
const initials = computed(() => form.name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'Г')
const form = reactive<GroupSettingsForm>({
  name: '',
  description: '',
  accessMode: 'BY_REQUEST',
  settings: {
    chatEnabled: true,
    lessonsEnabled: true,
    assignmentsEnabled: true,
    scheduleEnabled: true,
    scheduleWeeklyEnabled: true,
    scheduleSpecialEnabled: true,
    usefulLinksEnabled: true
  }
})

const imageFields = {
  avatar: {
    currentFileId: currentAvatarFileId,
    touched: avatarTouched,
    setFile: setAvatarFile,
    setPreviewUrl: setAvatarPreviewUrl
  },
  catalog: {
    currentFileId: currentCatalogImageFileId,
    touched: catalogImageTouched,
    setFile: setCatalogImageFile,
    setPreviewUrl: setCatalogImagePreviewUrl
  }
} as const

function fillForm(nextGroup: Group | null) {
  if (!nextGroup) {
    return
  }

  form.name = nextGroup.name
  form.description = nextGroup.description ?? ''
  form.accessMode = nextGroup.accessMode
  currentAvatarFileId.value = nextGroup.avatarFileId ?? null
  currentCatalogImageFileId.value = nextGroup.catalogImageFileId ?? null
  setAvatarPreviewUrl(nextGroup.avatarUrl ?? null)
  setCatalogImagePreviewUrl(nextGroup.catalogImageUrl ?? null)
  avatarTouched.value = false
  catalogImageTouched.value = false
  form.settings = {
    ...nextGroup.settings,
    scheduleWeeklyEnabled: nextGroup.settings.scheduleWeeklyEnabled ?? true,
    scheduleSpecialEnabled: nextGroup.settings.scheduleSpecialEnabled ?? true
  }
}

function isValidImageFile(file: File | null) {
  if (!file || file.type.startsWith('image/')) {
    return true
  }

  notifications.error('Можно загрузить только изображение')
  return false
}

function handleImageSelection(kind: 'avatar' | 'catalog', file: File | null) {
  if (!isValidImageFile(file)) {
    return
  }

  const field = imageFields[kind]
  field.touched.value = true
  field.setFile(file)

  if (!file) {
    field.currentFileId.value = null
  }
}

function handleAvatarSelection(file: File | null) {
  handleImageSelection('avatar', file)
}

function handleCatalogSelection(file: File | null) {
  handleImageSelection('catalog', file)
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
  let avatarFileId = currentAvatarFileId.value
  let catalogImageFileId = currentCatalogImageFileId.value

  isSubmitting.value = true

  try {
    if (avatarFile.value) {
      const uploadedAvatar = await uploadFile(avatarFile.value, 'group-avatars', auth.accessToken)
      avatarFileId = uploadedAvatar.id
    }

    if (catalogImageFile.value) {
      const uploadedCatalogImage = await uploadFile(catalogImageFile.value, 'group-catalog', auth.accessToken)
      catalogImageFileId = uploadedCatalogImage.id
    }

    const groupPayload: UpdateGroupPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      ...(avatarTouched.value ? { avatarFileId } : {}),
      ...(catalogImageTouched.value ? { catalogImageFileId } : {}),
      accessMode: form.accessMode
    }
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
      <GroupImagesSection
        heading-id="group-settings-images-title"
        :avatar-preview-url="avatarPreviewUrl"
        :avatar-placeholder="initials"
        :avatar-clear-visible="Boolean(avatarPreviewUrl)"
        :catalog-preview-url="catalogImagePreviewUrl"
        :catalog-clear-visible="Boolean(catalogImagePreviewUrl)"
        @avatar-select="handleAvatarSelection"
        @catalog-select="handleCatalogSelection"
      />
      <GroupAccessModeSelect v-model="form.accessMode" name="accessMode" />
      <GroupSettingsModulesSection
        v-model="form.settings"
        title-id="group-settings-modules-title"
        show-schedule-submodules
      />

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

.group-settings-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
}
</style>
