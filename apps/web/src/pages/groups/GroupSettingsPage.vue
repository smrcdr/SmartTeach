<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
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
const avatarInput = ref<HTMLInputElement | null>(null)
const catalogImageInput = ref<HTMLInputElement | null>(null)
const avatarFile = ref<File | null>(null)
const catalogImageFile = ref<File | null>(null)
const avatarPreviewUrl = ref<string | null>(null)
const catalogImagePreviewUrl = ref<string | null>(null)
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

function fillForm(nextGroup: Group | null) {
  if (!nextGroup) {
    return
  }

  form.name = nextGroup.name
  form.description = nextGroup.description ?? ''
  form.accessMode = nextGroup.accessMode
  currentAvatarFileId.value = nextGroup.avatarFileId ?? null
  currentCatalogImageFileId.value = nextGroup.catalogImageFileId ?? null
  avatarPreviewUrl.value = nextGroup.avatarUrl ?? null
  catalogImagePreviewUrl.value = nextGroup.catalogImageUrl ?? null
  avatarFile.value = null
  catalogImageFile.value = null
  avatarTouched.value = false
  catalogImageTouched.value = false
  form.settings = {
    ...nextGroup.settings,
    scheduleWeeklyEnabled: nextGroup.settings.scheduleWeeklyEnabled ?? true,
    scheduleSpecialEnabled: nextGroup.settings.scheduleSpecialEnabled ?? true
  }
}

function revokePreview(url: string | null) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

function setImageFile(kind: 'avatar' | 'catalog', file: File | null) {
  if (file && !file.type.startsWith('image/')) {
    notifications.error('Можно загрузить только изображение')
    return
  }

  if (kind === 'avatar') {
    revokePreview(avatarPreviewUrl.value)
    avatarFile.value = file
    avatarTouched.value = true
    currentAvatarFileId.value = file ? currentAvatarFileId.value : null
    avatarPreviewUrl.value = file ? URL.createObjectURL(file) : null
    return
  }

  revokePreview(catalogImagePreviewUrl.value)
  catalogImageFile.value = file
  catalogImageTouched.value = true
  currentCatalogImageFileId.value = file ? currentCatalogImageFileId.value : null
  catalogImagePreviewUrl.value = file ? URL.createObjectURL(file) : null
}

function handleImageChange(kind: 'avatar' | 'catalog', event: Event) {
  const input = event.target as HTMLInputElement
  setImageFile(kind, input.files?.[0] ?? null)
}

function clearImage(kind: 'avatar' | 'catalog') {
  setImageFile(kind, null)

  if (kind === 'avatar') {
    currentAvatarFileId.value = null

    if (avatarInput.value) {
      avatarInput.value.value = ''
    }

    return
  }

  currentCatalogImageFileId.value = null

  if (catalogImageInput.value) {
    catalogImageInput.value.value = ''
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

onBeforeUnmount(() => {
  revokePreview(avatarPreviewUrl.value)
  revokePreview(catalogImagePreviewUrl.value)
})
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
      <section class="group-images" aria-labelledby="group-settings-images-title">
        <h2 id="group-settings-images-title">Изображения</h2>
        <div class="group-images__grid">
          <div class="group-image-field">
            <div class="group-image-field__avatar">
              <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="">
              <span v-else>{{ initials }}</span>
            </div>
            <div class="group-image-field__body">
              <strong>Аватар группы</strong>
              <p>Показывается в карточках и внутри группы.</p>
              <div class="group-image-field__actions">
                <AppButton type="button" variant="secondary" @click="avatarInput?.click()">Выбрать</AppButton>
                <button v-if="avatarPreviewUrl" type="button" @click="clearImage('avatar')">Убрать</button>
              </div>
              <input ref="avatarInput" type="file" accept="image/*" @change="handleImageChange('avatar', $event)">
            </div>
          </div>

          <div class="group-image-field">
            <div class="group-image-field__catalog">
              <img v-if="catalogImagePreviewUrl" :src="catalogImagePreviewUrl" alt="">
              <span v-else>Каталог</span>
            </div>
            <div class="group-image-field__body">
              <strong>Картинка каталога</strong>
              <p>Отображается как основное изображение в каталоге групп.</p>
              <div class="group-image-field__actions">
                <AppButton type="button" variant="secondary" @click="catalogImageInput?.click()">Выбрать</AppButton>
                <button v-if="catalogImagePreviewUrl" type="button" @click="clearImage('catalog')">Убрать</button>
              </div>
              <input ref="catalogImageInput" type="file" accept="image/*" @change="handleImageChange('catalog', $event)">
            </div>
          </div>
        </div>
      </section>
      <GroupAccessModeSelect v-model="form.accessMode" name="accessMode" />

      <section class="group-settings-form__modules" aria-labelledby="group-settings-modules-title">
        <h2 id="group-settings-modules-title">Разделы</h2>
        <div class="group-settings-form__module-grid">
          <GroupModuleSwitch
            v-for="option in groupSettingOptions"
            v-show="option.key !== 'scheduleWeeklyEnabled' && option.key !== 'scheduleSpecialEnabled'"
            :key="option.key"
            v-model="form.settings[option.key]"
            :name="option.key"
            :label="option.label"
          />
        </div>
        <div v-if="form.settings.scheduleEnabled" class="group-settings-form__schedule-submodules">
          <h3>Расписание</h3>
          <GroupModuleSwitch
            v-model="form.settings.scheduleWeeklyEnabled"
            name="scheduleWeeklyEnabled"
            label="Еженедельные события"
          />
          <GroupModuleSwitch
            v-model="form.settings.scheduleSpecialEnabled"
            name="scheduleSpecialEnabled"
            label="Особые события"
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

.group-settings-form__modules h2,
.group-images h2 {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.group-images {
  display: grid;
  gap: 14px;
}

.group-images__grid {
  display: grid;
  gap: 12px;
}

.group-image-field {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-md);
  display: grid;
  gap: 16px;
  grid-template-columns: 112px 1fr;
  padding: 14px;
}

.group-image-field__avatar,
.group-image-field__catalog {
  align-items: center;
  background: var(--color-primary);
  color: #fff;
  display: grid;
  font-weight: 900;
  justify-items: center;
  overflow: hidden;
}

.group-image-field__avatar {
  aspect-ratio: 1;
  border-radius: 999px;
  font-size: 2rem;
}

.group-image-field__catalog {
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-md);
  font-size: 0.86rem;
}

.group-image-field img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.group-image-field__body {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.group-image-field__body strong {
  color: var(--color-text);
}

.group-image-field__body p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.45;
  margin: 0;
}

.group-image-field__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.group-image-field__actions button:not(.app-button) {
  background: transparent;
  border: 0;
  color: var(--color-text-muted);
  cursor: pointer;
  font-weight: 780;
  padding: 0;
}

.group-image-field__actions button:not(.app-button):hover {
  color: var(--color-danger);
}

.group-image-field input {
  display: none;
}

.group-settings-form__module-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.group-settings-form__schedule-submodules {
  border-left: 3px solid var(--color-primary);
  display: grid;
  gap: 12px;
  padding-left: 16px;
}

.group-settings-form__schedule-submodules h3 {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
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

  .group-image-field {
    grid-template-columns: 1fr;
  }

  .group-image-field__avatar,
  .group-image-field__catalog {
    max-width: 180px;
  }
}
</style>
