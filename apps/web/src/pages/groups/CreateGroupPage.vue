<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createGroup,
  type CreateGroupPayload,
  type GroupSettings
} from '@/features/groups/api/groups.api'
import { uploadFile } from '@/shared/api/files.api'
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
const avatarInput = ref<HTMLInputElement | null>(null)
const catalogImageInput = ref<HTMLInputElement | null>(null)
const avatarFile = ref<File | null>(null)
const catalogImageFile = ref<File | null>(null)
const avatarPreviewUrl = ref<string | null>(null)
const catalogImagePreviewUrl = ref<string | null>(null)
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

function revokePreview(url: string | null) {
  if (url) {
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
    avatarPreviewUrl.value = file ? URL.createObjectURL(file) : null
    return
  }

  revokePreview(catalogImagePreviewUrl.value)
  catalogImageFile.value = file
  catalogImagePreviewUrl.value = file ? URL.createObjectURL(file) : null
}

function handleImageChange(kind: 'avatar' | 'catalog', event: Event) {
  const input = event.target as HTMLInputElement
  setImageFile(kind, input.files?.[0] ?? null)
}

function clearImage(kind: 'avatar' | 'catalog') {
  setImageFile(kind, null)

  if (kind === 'avatar' && avatarInput.value) {
    avatarInput.value.value = ''
  }

  if (kind === 'catalog' && catalogImageInput.value) {
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

onBeforeUnmount(() => {
  revokePreview(avatarPreviewUrl.value)
  revokePreview(catalogImagePreviewUrl.value)
})
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
      <section class="group-images" aria-labelledby="group-images-title">
        <h2 id="group-images-title">Изображения</h2>
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
                <button v-if="avatarFile" type="button" @click="clearImage('avatar')">Убрать</button>
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
                <button v-if="catalogImageFile" type="button" @click="clearImage('catalog')">Убрать</button>
              </div>
              <input ref="catalogImageInput" type="file" accept="image/*" @change="handleImageChange('catalog', $event)">
            </div>
          </div>
        </div>
      </section>
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

.create-group-form__modules h2,
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

  .group-image-field {
    grid-template-columns: 1fr;
  }

  .group-image-field__avatar,
  .group-image-field__catalog {
    max-width: 180px;
  }
}
</style>
