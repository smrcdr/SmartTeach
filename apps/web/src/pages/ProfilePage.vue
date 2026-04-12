<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { currentUser, profileBio, profileInfo, profileSkills } from '../data/mockDashboard'
</script>

<template>
  <main class="dashboard-layout">
    <section class="dashboard-main">
      <section class="intro catalog-intro">
        <h1>Профиль</h1>
        <p class="intro-copy">
          Управляйте личной информацией, учебной активностью и основными настройками аккаунта.
        </p>
      </section>

      <section class="profile-layout">
        <aside class="profile-hero">
          <img :src="currentUser.avatar" :alt="currentUser.name" class="profile-avatar" />
          <h2>{{ currentUser.name }}</h2>
          <p class="profile-bio">{{ profileBio }}</p>

          <div class="profile-skills">
            <span v-for="skill in profileSkills" :key="skill" class="tag-pill">{{ skill }}</span>
          </div>

          <RouterLink to="/profile/edit" class="primary-btn profile-action-link">
            Редактировать профиль
          </RouterLink>
        </aside>

        <section class="profile-content">
          <section class="profile-panel">
            <div class="profile-panel-header">
              <h2>Основная информация</h2>
            </div>

            <div class="profile-info-grid">
              <article v-for="item in profileInfo" :key="item.label" class="profile-info-item">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </article>
            </div>
          </section>

          <section class="profile-panel">
            <div class="profile-panel-header">
              <h2>Настройки</h2>
            </div>

            <div class="profile-settings-list">
              <button type="button" class="profile-setting-row">
                <div>
                  <strong>Уведомления</strong>
                  <span>Управление сообщениями, напоминаниями и обновлениями групп</span>
                </div>
                <span class="material-symbols-outlined">chevron_right</span>
              </button>

              <button type="button" class="profile-setting-row">
                <div>
                  <strong>Безопасность</strong>
                  <span>Пароль, устройства и способы входа в аккаунт</span>
                </div>
                <span class="material-symbols-outlined">chevron_right</span>
              </button>

              <button type="button" class="profile-setting-row">
                <div>
                  <strong>Настройки приватности</strong>
                  <span>Кто видит ваш профиль и учебную активность</span>
                </div>
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </section>
        </section>
      </section>
    </section>
  </main>
</template>
