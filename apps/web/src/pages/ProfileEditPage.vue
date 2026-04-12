<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  currentUser,
  profileBio,
  profileInfo,
  profileSkillOptions,
  profileSkills,
} from '../data/mockDashboard'

const profileForm = ref({
  name: currentUser.name,
  role: 'Участник SmartTeach',
  bio: profileBio,
  avatar: currentUser.avatar,
  avatarFileName: '',
  email: profileInfo.find((item) => item.label === 'Email')?.value ?? '',
  phone: profileInfo.find((item) => item.label === 'Телефон')?.value ?? '',
  city: profileInfo.find((item) => item.label === 'Город')?.value ?? '',
  interfaceLanguage: profileInfo.find((item) => item.label === 'Язык интерфейса')?.value ?? '',
})

const selectedSkills = ref([...profileSkills])
const skillSearchQuery = ref('')
const avatarInput = ref<HTMLInputElement | null>(null)
const selectedAvatarFile = ref<File | null>(null)
let uploadedAvatarUrl: string | null = null

const avatarStatusText = computed(() =>
  selectedAvatarFile.value
    ? `Выбран файл: ${selectedAvatarFile.value.name}`
    : 'Здесь пока используется мок-аватар. Позже это поле можно связать с загрузкой в API.',
)

const filteredSkillOptions = computed(() =>
  profileSkillOptions.filter((skill) =>
    skill.toLowerCase().includes(skillSearchQuery.value.trim().toLowerCase()),
  ),
)

const openAvatarPicker = () => {
  avatarInput.value?.click()
}

const updateAvatar = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  if (uploadedAvatarUrl) {
    URL.revokeObjectURL(uploadedAvatarUrl)
  }

  uploadedAvatarUrl = URL.createObjectURL(file)
  selectedAvatarFile.value = file
  profileForm.value.avatar = uploadedAvatarUrl
  profileForm.value.avatarFileName = file.name
}

const toggleSkill = (skill: string) => {
  selectedSkills.value = selectedSkills.value.includes(skill)
    ? selectedSkills.value.filter((item) => item !== skill)
    : [...selectedSkills.value, skill]
}

onBeforeUnmount(() => {
  if (uploadedAvatarUrl) {
    URL.revokeObjectURL(uploadedAvatarUrl)
  }
})
</script>

<template>
  <main class="dashboard-layout">
    <section class="dashboard-main">
      <section class="intro catalog-intro">
        <h1>Редактирование профиля</h1>
        <p class="intro-copy">
          Обновите основные данные аккаунта. Форма остается на мок-данных, чтобы потом было легко
          подключить сохранение через бэкенд.
        </p>
      </section>

      <section class="profile-edit-layout">
        <section class="profile-panel profile-edit-panel">
          <div class="profile-panel-header">
            <h2>Основные данные</h2>
          </div>

          <div class="profile-editor-form profile-editor-form-page">
            <section class="profile-avatar-field profile-field-wide">
              <div class="profile-avatar-card">
                <img :src="profileForm.avatar" :alt="profileForm.name" class="profile-avatar profile-avatar-edit" />

                <div class="profile-avatar-meta">
                  <div>
                    <strong>Фото профиля</strong>
                    <p>{{ avatarStatusText }}</p>
                  </div>

                  <div class="profile-avatar-actions">
                    <input
                      ref="avatarInput"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      class="profile-avatar-input"
                      @change="updateAvatar"
                    />
                    <button type="button" class="primary-btn" @click="openAvatarPicker">
                      Изменить фото
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <label class="profile-field">
              <span>Имя</span>
              <input v-model="profileForm.name" type="text" maxlength="60" />
            </label>

            <label class="profile-field">
              <span>Роль</span>
              <input v-model="profileForm.role" type="text" maxlength="80" />
            </label>

            <label class="profile-field">
              <span>Email</span>
              <input v-model="profileForm.email" type="email" maxlength="120" />
            </label>

            <label class="profile-field">
              <span>Телефон</span>
              <input v-model="profileForm.phone" type="text" maxlength="24" />
            </label>

            <label class="profile-field">
              <span>Город</span>
              <input v-model="profileForm.city" type="text" maxlength="80" />
            </label>

            <label class="profile-field">
              <span>Язык интерфейса</span>
              <input v-model="profileForm.interfaceLanguage" type="text" maxlength="40" />
            </label>

            <label class="profile-field profile-field-wide">
              <span>О себе</span>
              <textarea v-model="profileForm.bio" rows="6" maxlength="500"></textarea>
            </label>

            <section class="profile-field profile-field-wide">
              <span>Теги</span>

              <label class="profile-tag-search">
                <span class="material-symbols-outlined search-icon">search</span>
                <input
                  v-model="skillSearchQuery"
                  type="text"
                  maxlength="40"
                  placeholder="Поиск доступных тегов..."
                />
              </label>

              <div class="profile-tag-options">
                <button
                  v-for="skill in filteredSkillOptions"
                  :key="skill"
                  type="button"
                  class="profile-tag-option"
                  :class="{ active: selectedSkills.includes(skill) }"
                  @click="toggleSkill(skill)"
                >
                  {{ skill }}
                </button>
              </div>
            </section>
          </div>

          <footer class="profile-editor-actions profile-editor-actions-page">
            <RouterLink to="/profile" class="profile-editor-cancel">Отмена</RouterLink>
            <button type="button" class="primary-btn">Сохранить</button>
          </footer>
        </section>
      </section>
    </section>
  </main>
</template>
