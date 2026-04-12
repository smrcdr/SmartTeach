<script setup lang="ts">
import CourseGrid from '../components/CourseGrid.vue'
import DashboardIntro from '../components/DashboardIntro.vue'
import { recommendedCourses } from '../data/mockDashboard'
</script>

<template>
  <main class="dashboard-layout">
    <section class="dashboard-main">
      <DashboardIntro />
      <CourseGrid :courses="recommendedCourses" />
    </section>
  </main>
</template>
