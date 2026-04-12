<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { allGroups } from '../data/mockDashboard'

const route = useRoute()

const group = computed(() => {
  const groupId = Number(route.params.id)

  if (Number.isNaN(groupId)) {
    return null
  }

  return allGroups.find((item) => item.id === groupId) ?? null
})

const stats = computed(() => {
  if (!group.value) {
    return []
  }

  return [
    { label: 'Участники', value: group.value.students },
    { label: 'Отзывы', value: String(group.value.reviewsCount) },
    { label: 'Язык', value: group.value.language },
    { label: 'Рейтинг', value: group.value.rating },
  ]
})
</script>

<template>
  <main class="dashboard-layout">
    <section class="dashboard-main">
      <section v-if="group" class="group-details-page">
        <section class="group-details-hero" :style="{ background: group.cover }">
          <div class="group-details-hero-overlay">
            <div class="group-details-breadcrumbs">
              <RouterLink to="/my-groups">Мои группы</RouterLink>
              <span>/</span>
              <span>{{ group.title }}</span>
            </div>

            <div class="group-details-hero-copy">
              <span class="group-details-badge">{{ group.language }}</span>
              <h1>{{ group.title }}</h1>
              <p>{{ group.description }}</p>
            </div>

            <div class="group-details-hero-actions">
              <RouterLink to="/join-group" class="primary-btn">Присоединиться к группе</RouterLink>
              <RouterLink to="/catalog" class="profile-editor-cancel">Вернуться в каталог</RouterLink>
            </div>
          </div>
        </section>

        <section class="group-details-layout">
          <section class="profile-panel">
            <div class="profile-panel-header">
              <h2>О группе</h2>
            </div>

            <div class="profile-info-grid group-details-stats">
              <article v-for="item in stats" :key="item.label" class="profile-info-item">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </article>
            </div>

            <div class="group-details-tags">
              <span v-for="tag in group.tags" :key="tag" class="tag-pill">{{ tag }}</span>
            </div>
          </section>

          <aside class="profile-content">
            <section class="profile-panel">
              <div class="profile-panel-header">
                <h2>Преподаватель</h2>
              </div>

              <div class="group-details-owner">
                <span class="group-details-owner-avatar">{{ group.author.charAt(0) }}</span>
                <div>
                  <strong>{{ group.author }}</strong>
                  <p>Куратор группы и автор материалов курса.</p>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </section>

      <section v-else class="placeholder-page">
        <h1>Группа не найдена</h1>
        <p>Проверьте адрес или вернитесь в каталог, чтобы открыть существующую группу.</p>
        <RouterLink to="/catalog" class="primary-btn group-details-missing-link">
          Перейти в каталог
        </RouterLink>
      </section>
    </section>
  </main>
</template>
