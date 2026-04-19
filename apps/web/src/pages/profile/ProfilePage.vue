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

const isBusy = computed(() => updateProfileMutation.isPending.value)
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
    return 'Укажите display name'
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
    return 'Bio не должно превышать 1000 символов'
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

  let uploadedAvatarId: string | null = null

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
    successMessage.value = 'Профиль обновлен'
  } catch (error) {
    if (uploadedAvatarId) {
      await Promise.allSettled([deleteUploadedProfileFile(uploadedAvatarId)])
    }

    submitError.value = getProfileErrorMessage(error, 'Не удалось сохранить изменения профиля')
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
    <header class="page-header">
      <span class="page-eyebrow">Оболочка приложения / Профиль</span>
      <h1 class="page-title">Профиль использует только реальные поля пользователя: имя, описание и аватар.</h1>
      <p class="page-lead">
        Изменения сразу идут через `/users/me`, а публичный профиль других пользователей показывает ровно эти же поля
        без декоративных добавок.
      </p>
    </header>

    <div class="section-grid">
      <AppCard class="span-4 profile-card">
        <div class="profile-card__identity">
          <div class="profile-card__avatar">
            <img
              v-if="effectiveAvatarUrl"
              :src="effectiveAvatarUrl"
              :alt="previewName"
              class="profile-card__avatar-image"
            />
            <span v-else>{{ getUserInitials(previewName) }}</span>
          </div>

          <div class="profile-card__copy">
            <h2 class="section-title">{{ previewName }}</h2>
            <p class="muted">
              {{ normalizeOptionalText(bio) || 'Публичное описание пока пустое. Его увидят участники и собеседники в личном чате.' }}
            </p>
          </div>
        </div>

        <div class="profile-card__actions">
          <label class="profile-card__upload">
            <input
              class="visually-hidden"
              type="file"
              accept="image/*"
              :disabled="isBusy"
              @change="handleAvatarSelection"
            />
            <span>{{ selectedAvatarFile ? 'Заменить выбранное изображение' : 'Загрузить аватар' }}</span>
          </label>

          <AppButton
            variant="ghost"
            size="sm"
            :disabled="isBusy || (!selectedAvatarFile && !currentUser.avatarFileId && avatarMode !== 'remove')"
            @click="handleAvatarRemove"
          >
            {{ avatarMode === 'remove' ? 'Аватар будет удален' : 'Убрать фото' }}
          </AppButton>

          <AppButton variant="secondary" size="sm" :disabled="isBusy || avatarMode === 'keep'" @click="restoreAvatarDraft">
            Отменить изменение фото
          </AppButton>
        </div>

        <p v-if="selectedAvatarFile" class="profile-card__meta">Выбрано: {{ selectedAvatarFile.name }}</p>
        <p v-else-if="currentUser.avatarUrl && avatarMode !== 'remove'" class="profile-card__meta">
          Текущий аватар уже опубликован в публичном профиле.
        </p>
        <p v-else class="profile-card__meta">Пока без аватара. Можно добавить изображение через `/files`.</p>

        <p v-if="avatarError" class="profile-card__error">{{ avatarError }}</p>
      </AppCard>

      <AppCard class="span-8 profile-form">
        <h2 class="section-title">Редактирование профиля</h2>
        <p class="muted">
          В форме нет `phone`, `city`, `role`, `skills` или других несуществующих полей. Только то, что реально
          поддерживает backend.
        </p>

        <form class="profile-form__fields" @submit.prevent="handleSubmit" @reset.prevent="handleReset">
          <AppInput
            v-model="displayName"
            label="Display name"
            autocomplete="name"
            maxlength="100"
            :disabled="isBusy"
            :error="displayNameError"
            hint="Имя используется в участниках, чатах и публичном профиле."
          />

          <AppTextarea
          v-model="bio"
          label="Bio"
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
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.profile-card,
.profile-form {
  gap: 1.2rem;
}

.profile-card__identity {
  display: grid;
  gap: 1rem;
}

.profile-card__avatar {
  display: grid;
  place-items: center;
  width: 7rem;
  height: 7rem;
  border-radius: 50%;
  background: rgba(31, 117, 156, 0.14);
  color: var(--color-accent-strong);
  font-size: 1.65rem;
  font-weight: 800;
}

.profile-card__avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-card__copy {
  display: grid;
  gap: 0.45rem;
}

.profile-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.profile-card__upload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.45rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-panel);
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
}

.profile-card__meta {
  color: var(--color-subtle);
  font-size: 0.9rem;
}

.profile-card__error,
.profile-form__message--error {
  color: var(--color-danger);
}

.profile-form__fields {
  display: grid;
  gap: 1rem;
}

.profile-form__message {
  padding: 0.9rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.profile-form__message--error {
  background: var(--color-danger-soft);
}

.profile-form__message--success {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}
</style>
