<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { useAuth } from '../../features/auth/composables/useAuth'
import {
  deleteUploadedProfileFile,
  getProfileErrorMessage,
  uploadProfileAvatar,
} from '../../features/profile/api/profile.api'
import { useUpdateMyProfileMutation } from '../../features/profile/composables/useProfiles'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppInput from '../../shared/ui/AppInput.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'
import AppTextarea from '../../shared/ui/AppTextarea.vue'
import { getUserInitials, normalizeOptionalText } from '../../shared/lib/user-profile'

const { currentUser, isInitializing } = useAuth()
const updateProfileMutation = useUpdateMyProfileMutation()

const displayName = ref('')
const bio = ref('')
const selectedAvatarFile = ref<File | null>(null)
const selectedAvatarPreviewUrl = ref<string | null>(null)
const avatarMode = ref<'keep' | 'replace' | 'remove'>('keep')
const avatarError = ref('')
const submitError = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

const isBusy = computed(() => isSubmitting.value || updateProfileMutation.isPending.value)
const currentBio = computed(() => currentUser.value?.bio ?? '')
const effectiveAvatarUrl = computed(() => {
  if (selectedAvatarPreviewUrl.value) {
    return selectedAvatarPreviewUrl.value
  }

  if (avatarMode.value === 'remove') {
    return null
  }

  return currentUser.value?.avatarUrl ?? null
})
const previewName = computed(() => displayName.value.trim() || currentUser.value?.displayName || 'SmartTeach')
const displayNameError = computed(() => {
  const normalizedValue = displayName.value.trim()

  if (!normalizedValue) {
    return 'Укажите имя'
  }

  if (normalizedValue.length < 2) {
    return 'Имя должно содержать минимум 2 символа'
  }

  if (normalizedValue.length > 100) {
    return 'Имя не должно превышать 100 символов'
  }

  return ''
})
const bioError = computed(() => {
  if (bio.value.trim().length > 1000) {
    return 'Описание не должно превышать 1000 символов'
  }

  return ''
})
const isDirty = computed(() => {
  if (!currentUser.value) {
    return false
  }

  return (
    displayName.value.trim() !== currentUser.value.displayName ||
    bio.value.trim() !== currentBio.value ||
    avatarMode.value !== 'keep'
  )
})
const isSaveDisabled = computed(
  () => !currentUser.value || !isDirty.value || Boolean(displayNameError.value || bioError.value || avatarError.value) || isBusy.value,
)

watch(
  currentUser,
  (user) => {
    if (!user) {
      return
    }

    displayName.value = user.displayName
    bio.value = user.bio ?? ''
    submitError.value = ''
    successMessage.value = ''
    restoreAvatarDraft()
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(() => {
  cleanupSelectedAvatarPreview()
})

function handleAvatarSelection(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  input.value = ''
  avatarError.value = ''
  submitError.value = ''
  successMessage.value = ''

  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    avatarError.value = 'Для аватара нужен файл изображения'
    return
  }

  cleanupSelectedAvatarPreview()

  selectedAvatarFile.value = file
  selectedAvatarPreviewUrl.value = URL.createObjectURL(file)
  avatarMode.value = 'replace'
}

function handleAvatarRemove() {
  avatarError.value = ''
  submitError.value = ''
  successMessage.value = ''
  cleanupSelectedAvatarPreview()
  avatarMode.value = currentUser.value?.avatarFileId ? 'remove' : 'keep'
}

function handleReset() {
  if (!currentUser.value) {
    return
  }

  displayName.value = currentUser.value.displayName
  bio.value = currentUser.value.bio ?? ''
  submitError.value = ''
  successMessage.value = ''
  avatarError.value = ''
  restoreAvatarDraft()
}

async function handleSubmit() {
  if (!currentUser.value || isSaveDisabled.value) {
    return
  }

  submitError.value = ''
  successMessage.value = ''

  const previousAvatarFileId = currentUser.value.avatarFileId ?? null
  let uploadedAvatarId: string | null = null

  isSubmitting.value = true

  try {
    const payload = {
      displayName: displayName.value.trim(),
      bio: bio.value.trim(),
    } as {
      displayName: string
      bio: string
      avatarFileId?: string | null
    }

    if (avatarMode.value === 'replace') {
      if (!selectedAvatarFile.value) {
        avatarError.value = 'Сначала выберите изображение для аватара'
        return
      }

      const uploadedAvatar = await uploadProfileAvatar(selectedAvatarFile.value)
      uploadedAvatarId = uploadedAvatar.id
      payload.avatarFileId = uploadedAvatar.id
    } else if (avatarMode.value === 'remove') {
      payload.avatarFileId = null
    }

    await updateProfileMutation.mutateAsync(payload)

    if (previousAvatarFileId && avatarMode.value !== 'keep' && previousAvatarFileId !== uploadedAvatarId) {
      try {
        await deleteUploadedProfileFile(previousAvatarFileId)
        successMessage.value = 'Профиль обновлен'
      } catch {
        successMessage.value = 'Профиль обновлен, но старый файл аватара не удалось удалить автоматически'
      }
    } else {
      successMessage.value = 'Профиль обновлен'
    }
  } catch (error) {
    if (uploadedAvatarId) {
      await Promise.allSettled([deleteUploadedProfileFile(uploadedAvatarId)])
    }

    submitError.value = getProfileErrorMessage(error, 'Не удалось сохранить изменения профиля')
  } finally {
    isSubmitting.value = false
  }
}

function restoreAvatarDraft() {
  cleanupSelectedAvatarPreview()
  avatarMode.value = 'keep'
  avatarError.value = ''
}

function cleanupSelectedAvatarPreview() {
  if (selectedAvatarPreviewUrl.value) {
    URL.revokeObjectURL(selectedAvatarPreviewUrl.value)
  }

  selectedAvatarPreviewUrl.value = null
  selectedAvatarFile.value = null
}
</script>

<template>
  <div v-if="isInitializing && !currentUser" class="page-shell">
    <AppLoader label="Загружаем текущий профиль" />
  </div>

  <div v-else-if="!currentUser" class="page-shell">
    <AppErrorState
      title="Профиль пока недоступен"
      description="Не удалось получить данные текущего пользователя. Обновите сессию и попробуйте снова."
    >
      <template #actions>
        <AppButton to="/groups" variant="secondary">К группам</AppButton>
      </template>
    </AppErrorState>
  </div>

  <div v-else class="page-shell">
    <section class="intro catalog-intro">
      <h1>Профиль</h1>
      <p class="intro-copy">
        Управляйте личной информацией, фото и публичным описанием в едином продуктовой карточке профиля.
      </p>
    </section>

    <section class="profile-layout">
      <aside class="profile-hero">
        <div class="profile-card__avatar">
          <img
            v-if="effectiveAvatarUrl"
            :src="effectiveAvatarUrl"
            :alt="previewName"
            class="profile-card__avatar-image"
          />
          <span v-else>{{ getUserInitials(previewName) }}</span>
        </div>

        <h2>{{ previewName }}</h2>
        <p class="profile-role">Участник SmartTeach</p>
        <p class="profile-bio">
          {{ normalizeOptionalText(bio) || 'Публичное описание пока пустое. Его увидят участники и собеседники в личном чате.' }}
        </p>

        <div class="profile-card__actions">
          <label class="profile-card__upload">
            <input
              class="visually-hidden"
              type="file"
              accept="image/*"
              :disabled="isBusy"
              @change="handleAvatarSelection"
            />
            <span>{{ selectedAvatarFile ? 'Заменить изображение' : 'Загрузить аватар' }}</span>
          </label>

          <AppButton
            variant="ghost"
            size="sm"
            :disabled="isBusy || (!selectedAvatarFile && !currentUser.avatarFileId && avatarMode !== 'remove')"
            @click="handleAvatarRemove"
          >
            {{ avatarMode === 'remove' ? 'Удаление аватара' : 'Убрать фото' }}
          </AppButton>

          <AppButton variant="secondary" size="sm" :disabled="isBusy || avatarMode === 'keep'" @click="restoreAvatarDraft">
            Отменить
          </AppButton>
        </div>

        <div class="profile-edit-preview">
          <article class="profile-info-item">
            <span>Email</span>
            <strong>{{ currentUser.email }}</strong>
          </article>
          <article class="profile-info-item">
            <span>Символов в описании</span>
            <strong>{{ bio.trim().length }}/1000</strong>
          </article>
        </div>

        <p v-if="selectedAvatarFile" class="profile-card__meta">Выбрано: {{ selectedAvatarFile.name }}</p>
        <p v-else-if="currentUser.avatarUrl && avatarMode !== 'remove'" class="profile-card__meta">
          Текущий аватар уже опубликован в публичном профиле.
        </p>
        <p v-else class="profile-card__meta">Пока без аватара. Можно добавить изображение через `/files`.</p>

        <p v-if="avatarError" class="profile-card__error">{{ avatarError }}</p>
      </aside>

      <section class="profile-content">
        <AppCard class="profile-panel">
          <div class="profile-panel-header">
            <h2>Основная информация</h2>
          </div>

          <div class="profile-info-grid">
            <article class="profile-info-item">
              <span>Имя</span>
              <strong>{{ previewName }}</strong>
            </article>
            <article class="profile-info-item">
              <span>Email</span>
              <strong>{{ currentUser.email }}</strong>
            </article>
            <article class="profile-info-item">
              <span>Публичный профиль</span>
              <strong>/users/{{ currentUser.id }}</strong>
            </article>
            <article class="profile-info-item">
              <span>Описание</span>
              <strong>{{ normalizeOptionalText(bio) || 'Пока пусто' }}</strong>
            </article>
          </div>
        </AppCard>

        <AppCard class="profile-panel">
          <div class="profile-panel-header">
            <h2>Редактирование профиля</h2>
          </div>

          <form class="profile-form__fields" @submit.prevent="handleSubmit" @reset.prevent="handleReset">
            <AppInput
              v-model="displayName"
              label="Имя"
              autocomplete="name"
              maxlength="100"
              :disabled="isBusy"
              :error="displayNameError"
              hint="Имя используется в участниках, чатах и публичном профиле."
            />

            <AppTextarea
              v-model="bio"
              label="Описание"
              maxlength="1000"
              :disabled="isBusy"
              :error="bioError"
              :hint="`Публичное описание. ${bio.trim().length}/1000`"
            />

            <div v-if="submitError" class="profile-form__message profile-form__message--error">{{ submitError }}</div>
            <div v-else-if="successMessage" class="profile-form__message profile-form__message--success">
              {{ successMessage }}
            </div>

            <div class="page-actions">
              <AppButton type="submit" :disabled="isSaveDisabled">
                {{ isBusy ? 'Сохраняем...' : 'Сохранить изменения' }}
              </AppButton>
              <AppButton type="reset" variant="secondary" :disabled="isBusy || !isDirty">Сбросить</AppButton>
              <AppButton
                variant="ghost"
                :to="{
                  name: 'public-user-profile',
                  params: {
                    userId: currentUser.id,
                  },
                }"
              >
                Открыть публичный профиль
              </AppButton>
            </div>
          </form>
        </AppCard>
      </section>
    </section>
  </div>
</template>

<style scoped>
.profile-card__avatar {
  display: grid;
  place-items: center;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  margin: 0 auto;
  background: #dff0fb;
  color: #1d8fe0;
  font-size: 1.4rem;
  font-weight: 800;
}

.profile-card__avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-card__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 18px;
}

.profile-card__upload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 8px 12px;
  border: 1px solid #c6d3df;
  border-radius: 12px;
  background: #f9fbfd;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.profile-edit-preview {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.profile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.profile-info-item {
  padding: 16px;
  background: #f9fbfd;
  border: 1px solid #c6d3df;
  border-radius: 18px;
}

.profile-info-item span {
  display: block;
  margin-bottom: 8px;
  font-size: 0.84rem;
  color: var(--color-subtle);
}

.profile-info-item strong {
  font-size: 1rem;
  line-height: 1.35;
}

.profile-card__meta {
  margin-top: 12px;
  color: var(--color-subtle);
  font-size: 0.9rem;
  text-align: center;
}

.profile-card__error,
.profile-form__message--error {
  color: var(--color-danger);
}

.profile-form__fields {
  display: grid;
  gap: 18px;
}

.profile-form__message {
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 600;
}

.profile-form__message--error {
  background: #fff1f1;
  border: 1px solid #f1c9c9;
}

.profile-form__message--success {
  background: #edf8d7;
  border: 1px solid #d9eab8;
  color: #355125;
}

@media (max-width: 900px) {
  .profile-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
