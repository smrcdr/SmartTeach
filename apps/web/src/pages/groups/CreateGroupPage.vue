<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createGroup,
  type CreateGroupPayload,
  type GroupSettings
} from '@/features/groups/api/groups.api'
import { uploadFile } from '@/shared/api/files.api'
import GroupAccessModeSelect from '@/features/groups/components/GroupAccessModeSelect.vue'
import GroupImagesSection from '@/features/groups/components/GroupImagesSection.vue'
import GroupSettingsModulesSection from '@/features/groups/components/GroupSettingsModulesSection.vue'
import { useImagePreviewField } from '@/features/groups/composables/useImagePreviewField'
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
const {
  file: avatarFile,
  previewUrl: avatarPreviewUrl,
  setFile: setAvatarFile
} = useImagePreviewField()
const {
  file: catalogImageFile,
  previewUrl: catalogImagePreviewUrl,
  setFile: setCatalogImageFile
} = useImagePreviewField()
const form = reactive<CreateGroupForm>({
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
  } satisfies GroupSettings
})
const initials = computed(() => form.name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'Г')

function isValidImageFile(file: File | null) {
  if (!file || file.type.startsWith('image/')) {
    return true
  }

  notifications.error('Можно загрузить только изображение')
  return false
}

function handleAvatarSelection(file: File | null) {
  if (!isValidImageFile(file)) {
    return
  }

  setAvatarFile(file)
}

function handleCatalogSelection(file: File | null) {
  if (!isValidImageFile(file)) {
    return
  }

  setCatalogImageFile(file)
}

async function buildPayload(): Promise<CreateGroupPayload> {
  const description = form.description.trim()
  const uploadedAvatar = avatarFile.value
    ? await uploadFile(avatarFile.value, 'group-avatars', auth.accessToken)
    : null
  const uploadedCatalogImage = catalogImageFile.value
    ? await uploadFile(catalogImageFile.value, 'group-catalog', auth.accessToken)
    : null

  return {
    name: form.name.trim(),
    ...(description ? { description } : {}),
    ...(uploadedAvatar ? { avatarFileId: uploadedAvatar.id } : {}),
    ...(uploadedCatalogImage ? { catalogImageFileId: uploadedCatalogImage.id } : {}),
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
    const group = await createGroup(await buildPayload(), auth.accessToken)
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
      <GroupImagesSection
        heading-id="group-images-title"
        :avatar-preview-url="avatarPreviewUrl"
        :avatar-placeholder="initials"
        :avatar-clear-visible="Boolean(avatarFile)"
        :catalog-preview-url="catalogImagePreviewUrl"
        :catalog-clear-visible="Boolean(catalogImageFile)"
        @avatar-select="handleAvatarSelection"
        @catalog-select="handleCatalogSelection"
      />
      <GroupAccessModeSelect v-model="form.accessMode" name="accessMode" />
      <GroupSettingsModulesSection v-model="form.settings" title-id="group-modules-title" />

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
</style>
