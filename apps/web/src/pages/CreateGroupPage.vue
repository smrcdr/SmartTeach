<script setup lang="ts">
import { ref } from 'vue'

const groupName = ref('')
const groupType = ref<'Обычная группа' | 'Курс' | 'Класс'>('Обычная группа')
const accessType = ref<'Открытая' | 'По заявке' | 'Закрытая'>('По заявке')
const language = ref<'Русский' | 'Английский'>('Русский')
const description = ref('')
const lessonsEnabled = ref(true)
const chatsEnabled = ref(true)
const homeworkEnabled = ref(false)
const createState = ref<'idle' | 'success'>('idle')

const submitCreateGroup = () => {
  createState.value = 'success'
}
</script>

<template>
  <main class="dashboard-layout">
    <section class="dashboard-main">
      <section class="intro catalog-intro">
        <h1>Создать группу</h1>
        <p class="intro-copy">
          Настройте новую группу, курс или класс, чтобы сразу начать работу с участниками и материалами.
        </p>
      </section>

      <section class="create-group-layout">
        <section class="profile-panel create-group-panel">
          <div class="profile-panel-header">
            <h2>Основные параметры</h2>
          </div>

          <div class="profile-editor-form profile-editor-form-page">
            <label class="profile-field">
              <span>Название группы</span>
              <input v-model="groupName" type="text" maxlength="80" placeholder="Например: Python Spring 2026" />
            </label>

            <label class="profile-field">
              <span>Тип</span>
              <select v-model="groupType" class="create-group-select">
                <option>Обычная группа</option>
                <option>Курс</option>
                <option>Класс</option>
              </select>
            </label>

            <label class="profile-field">
              <span>Доступ</span>
              <select v-model="accessType" class="create-group-select">
                <option>Открытая</option>
                <option>По заявке</option>
                <option>Закрытая</option>
              </select>
            </label>

            <label class="profile-field">
              <span>Язык</span>
              <select v-model="language" class="create-group-select">
                <option>Русский</option>
                <option>Английский</option>
              </select>
            </label>

            <label class="profile-field profile-field-wide">
              <span>Описание</span>
              <textarea
                v-model="description"
                rows="6"
                maxlength="500"
                placeholder="Коротко опишите цель группы, формат занятий и ожидания от участников."
              ></textarea>
            </label>

            <section class="profile-field profile-field-wide">
              <span>Функции группы</span>

              <div class="create-group-toggles create-group-toggles-inline">
                <label class="create-group-toggle">
                  <input v-model="lessonsEnabled" type="checkbox" />
                  <span>Уроки</span>
                </label>

                <label class="create-group-toggle">
                  <input v-model="chatsEnabled" type="checkbox" />
                  <span>Чаты</span>
                </label>

                <label class="create-group-toggle">
                  <input v-model="homeworkEnabled" type="checkbox" />
                  <span>Домашние задания</span>
                </label>
              </div>
            </section>
          </div>

          <button type="button" class="primary-btn profile-action-link" @click="submitCreateGroup">
            Создать группу
          </button>

          <div v-if="createState === 'success'" class="join-message success">
            <strong>Группа успешно создана.</strong>
            <span>Это моковый сценарий без сохранения на бэкенде.</span>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>
