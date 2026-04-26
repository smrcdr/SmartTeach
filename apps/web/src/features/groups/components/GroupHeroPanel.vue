<script setup lang="ts">
import { ArrowRight, BookOpen, ClipboardList, Users } from 'lucide-vue-next'
import type { DemoGroup } from '@/app/demo/types'
import AppButton from '@/shared/ui/AppButton.vue'
import MetricTile from '@/shared/ui/MetricTile.vue'
import ModuleBadges from './ModuleBadges.vue'

defineProps<{
  group: DemoGroup
}>()
</script>

<template>
  <section class="group-hero">
    <div class="group-hero__copy">
      <span class="eyebrow">Учебная группа</span>
      <h1 class="page-title">{{ group.title }}</h1>
      <p class="lead">{{ group.description }}</p>
      <ModuleBadges :modules="group.modules" />
      <div class="group-hero__actions">
        <RouterLink :to="{ name: 'group-workspace', params: { groupId: group.id } }">
          <AppButton size="lg">Открыть группу <ArrowRight :size="18" /></AppButton>
        </RouterLink>
        <AppButton variant="secondary" size="lg">Код {{ group.code }}</AppButton>
      </div>
    </div>

    <div class="group-hero__visual">
      <img :src="group.coverImage" :alt="group.title" />
    </div>
  </section>

  <section class="group-hero__metrics">
    <MetricTile label="Участников" :value="group.membersCount.toLocaleString('ru-RU')" detail="Активная учебная аудитория" :icon="Users" />
    <MetricTile label="Уроков" :value="group.lessons.length || 12" detail="Материалы и практические разборы" :icon="BookOpen" />
    <MetricTile label="Заданий" :value="group.assignments.length || 5" detail="Проверка прогресса внутри группы" :icon="ClipboardList" />
  </section>
</template>

<style scoped>
.group-hero {
  align-items: stretch;
  display: grid;
  gap: 32px;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 520px);
  margin-bottom: 32px;
}

.group-hero__copy {
  align-content: center;
  background: var(--color-surface-low);
  border-radius: var(--radius-lg);
  display: grid;
  gap: 24px;
  padding: clamp(32px, 5vw, 58px);
}

.group-hero__visual {
  border-radius: var(--radius-lg);
  min-height: 420px;
  overflow: hidden;
}

.group-hero__visual img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.group-hero__actions,
.group-hero__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.group-hero__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 980px) {
  .group-hero {
    grid-template-columns: 1fr;
  }

  .group-hero__visual {
    min-height: 300px;
  }

  .group-hero__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
