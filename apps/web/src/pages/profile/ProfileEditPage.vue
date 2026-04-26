<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { updateMyProfile } from '@/features/users/api/users.api'
import { uploadFile } from '@/shared/api/files.api'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const router = useRouter()
const hasInitializedForm = ref(false)
const selectedAvatarFile = ref<File | null>(null)
const isSaving = ref(false)
const shouldClearAvatar = ref(false)
const form = reactive({
  displayName: '',
  bio: ''
})
const initials = computed(() => auth.user?.displayName.slice(0, 1).toUpperCase() ?? '')

watchEffect(() => {
  if (!auth.user || hasInitializedForm.value) {
    return
  }

  form.displayName = auth.user.displayName
  form.bio = auth.user.bio || ''
  hasInitializedForm.value = true
})

function selectAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  selectedAvatarFile.value = input.files?.[0] ?? null
  shouldClearAvatar.value = false
}

function clearAvatar() {
  selectedAvatarFile.value = null
  shouldClearAvatar.value = true
}

async function submit() {
  if (!auth.accessToken) {
    notifications.error('Нужно войти в аккаунт')
    return
  }

  isSaving.value = true

  try {
    let avatarFileId = auth.user?.avatarFileId

    if (selectedAvatarFile.value) {
      const uploadedAvatar = await uploadFile(selectedAvatarFile.value, 'avatars', auth.accessToken)
      avatarFileId = uploadedAvatar.id
    }

    if (shouldClearAvatar.value) {
      avatarFileId = null
    }

    auth.user = await updateMyProfile({
      displayName: form.displayName,
      bio: form.bio,
      avatarFileId
    }, auth.accessToken)
    notifications.success('Профиль обновлён')
    await router.push('/profile')
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось обновить профиль')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main class="page narrow-page profile-edit-page">
    <form v-if="auth.user" class="profile-edit surface-panel" @submit.prevent="submit">
      <section class="profile-edit__avatar" aria-label="Аватар профиля">
        <img v-if="auth.user.avatarUrl && !shouldClearAvatar" :src="auth.user.avatarUrl" :alt="auth.user.displayName" />
        <span v-else class="profile-edit__initials">{{ initials }}</span>
        <label class="profile-edit__file">
          <span>Загрузить аватар</span>
          <input type="file" accept="image/*" @change="selectAvatar" />
        </label>
        <button
          v-if="auth.user.avatarUrl || selectedAvatarFile"
          class="profile-edit__clear"
          type="button"
          @click="clearAvatar"
        >
          Убрать аватар
        </button>
      </section>

      <section class="profile-edit__form">
        <div>
          <span class="eyebrow">Профиль</span>
          <h1>Редактировать профиль</h1>
        </div>
        <AppTextField
          v-model="form.displayName"
          name="displayName"
          label="Имя"
          placeholder="Введите имя"
        />
        <AppTextarea
          v-model="form.bio"
          name="bio"
          label="О себе"
          placeholder="Расскажите о себе"
          :rows="5"
        />
        <div class="profile-edit__actions">
          <AppButton type="submit" size="lg">{{ isSaving ? 'Сохраняем...' : 'Сохранить' }}</AppButton>
          <RouterLink to="/profile">Отмена</RouterLink>
        </div>
      </section>
    </form>
    <EmptyState v-else title="Профиль не загружен" description="Войдите в аккаунт, чтобы редактировать профиль." />
  </main>
</template>

<style scoped>
.profile-edit {
  display: grid;
  gap: 34px;
  grid-template-columns: 180px minmax(0, 1fr);
  padding: clamp(24px, 4vw, 42px);
}

.profile-edit__avatar {
  align-content: start;
  display: grid;
  gap: 14px;
  justify-items: center;
}

.profile-edit__avatar img,
.profile-edit__initials {
  border-radius: 50%;
  height: 150px;
  width: 150px;
}

.profile-edit__avatar img {
  object-fit: cover;
}

.profile-edit__initials {
  align-items: center;
  background: var(--color-primary);
  color: #fff;
  display: inline-flex;
  font-size: 3.2rem;
  font-weight: 900;
  justify-content: center;
}

.profile-edit__file,
.profile-edit__clear,
.profile-edit__actions a {
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 800;
}

.profile-edit__file input {
  display: none;
}

.profile-edit__clear {
  background: transparent;
  border: 0;
  padding: 0;
}

.profile-edit__form {
  display: grid;
  gap: 18px;
}

.profile-edit__form h1 {
  color: var(--color-primary);
  font-size: clamp(2rem, 4vw, 2.8rem);
  line-height: 1;
  margin: 0;
}

.profile-edit__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

@media (max-width: 760px) {
  .profile-edit {
    grid-template-columns: 1fr;
  }
}
</style>
