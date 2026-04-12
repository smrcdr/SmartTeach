<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { CourseCardItem } from '../types/dashboard'

defineProps<{
  course: CourseCardItem
}>()
</script>

<template>
  <RouterLink :to="course.to" class="course-card course-card-link">
    <article>
      <div class="course-cover" :style="{ background: course.cover }">
      </div>

      <div class="course-body">
        <h2>{{ course.title }}</h2>

        <div class="author-row">
          <span class="author-avatar"></span>
          <span>{{ course.author }}</span>
        </div>

        <div class="tag-row">
          <span v-for="tag in course.tags" :key="tag" class="tag-pill">{{ tag }}</span>
        </div>

        <p class="course-description">{{ course.description }}</p>

        <div class="course-footer">
          <div class="course-stats">
            <span>★ {{ course.rating }}</span>
            <span>{{ course.students }}</span>
          </div>

          <span class="primary-btn">{{ course.actionLabel }}</span>
        </div>
      </div>
    </article>
  </RouterLink>
</template>
