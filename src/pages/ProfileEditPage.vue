<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  currentUser,
  profileBio,
  profileInfo,
  profileSkillOptions,
  profileSkills,
} from '../data/mockDashboard'

const profileName = ref(currentUser.name)
const profileRole = ref('Участник SmartTeach')
const profileDescription = ref(profileBio)
const selectedSkills = ref([...profileSkills])
const skillSearchQuery = ref('')

const editableInfo = ref({
  email: profileInfo.find((item) => item.label === 'Email')?.value ?? '',
  phone: profileInfo.find((item) => item.label === 'Телефон')?.value ?? '',
  city: profileInfo.find((item) => item.label === 'Город')?.value ?? '',
  interfaceLanguage: profileInfo.find((item) => item.label === 'Язык интерфейса')?.value ?? '',
})

const profilePreview = computed(() => [
  { label: 'Имя', value: profileName.value },
  { label: 'Роль', value: profileRole.value },
  { label: 'Email', value: editableInfo.value.email },
  { label: 'Город', value: editableInfo.value.city },
])

const filteredSkillOptions = computed(() =>
  profileSkillOptions.filter((skill) =>
    skill.toLowerCase().includes(skillSearchQuery.value.trim().toLowerCase()),
  ),
)

const toggleSkill = (skill: string) => {
  selectedSkills.value = selectedSkills.value.includes(skill)
    ? selectedSkills.value.filter((item) => item !== skill)
    : [...selectedSkills.value, skill]
}
</script>

<template>
  <main class="dashboard-layout">
    <section class="dashboard-main">
      <section class="intro catalog-intro">
        <h1>Редактирование профиля</h1>
        <p class="intro-copy">
          Обновите основные данные аккаунта и проверьте, как они будут выглядеть в профиле.
        </p>
      </section>

      <section class="profile-edit-layout">
        <aside class="profile-hero">
          <img :src="currentUser.avatar" :alt="profileName" class="profile-avatar" />
          <h2>{{ profileName }}</h2>
          <p class="profile-role">{{ profileRole }}</p>
          <p class="profile-bio">{{ profileDescription }}</p>

          <div class="profile-skills">
            <span v-for="skill in selectedSkills" :key="skill" class="tag-pill">{{ skill }}</span>
          </div>

          <div class="profile-edit-preview">
            <article v-for="item in profilePreview" :key="item.label" class="profile-info-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </article>
          </div>
        </aside>

        <section class="profile-panel profile-edit-panel">
          <div class="profile-panel-header">
            <h2>Основные данные</h2>
          </div>

          <div class="profile-editor-form profile-editor-form-page">
            <label class="profile-field">
              <span>Имя</span>
              <input v-model="profileName" type="text" maxlength="60" />
            </label>

            <label class="profile-field">
              <span>Роль</span>
              <input v-model="profileRole" type="text" maxlength="80" />
            </label>

            <label class="profile-field">
              <span>Email</span>
              <input v-model="editableInfo.email" type="email" maxlength="120" />
            </label>

            <label class="profile-field">
              <span>Телефон</span>
              <input v-model="editableInfo.phone" type="text" maxlength="24" />
            </label>

            <label class="profile-field">
              <span>Город</span>
              <input v-model="editableInfo.city" type="text" maxlength="80" />
            </label>

            <label class="profile-field">
              <span>Язык интерфейса</span>
              <input v-model="editableInfo.interfaceLanguage" type="text" maxlength="40" />
            </label>

            <label class="profile-field profile-field-wide">
              <span>О себе</span>
              <textarea v-model="profileDescription" rows="6" maxlength="500"></textarea>
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
