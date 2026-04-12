<script setup lang="ts">
import CourseCard from './CourseCard.vue'
import type { CourseCardItem } from '../types/dashboard'

defineProps<{
  courses: CourseCardItem[]
}>()
</script>

<template>
  <section class="course-section">
    <div class="course-grid">
      <CourseCard v-for="course in courses" :key="course.id" :course="course" />
    </div>
  </section>
</template>
