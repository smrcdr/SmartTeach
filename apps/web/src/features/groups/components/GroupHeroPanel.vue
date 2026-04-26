<script setup lang="ts">
import { ArrowRight, BookOpen, LockKeyhole, Users } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Group } from '../api/groups.api'
import AppButton from '@/shared/ui/AppButton.vue'
import MetricTile from '@/shared/ui/MetricTile.vue'
import ModuleBadges from './ModuleBadges.vue'

const props = defineProps<{
  group: Group
}>()

const initials = computed(() => props.group.name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase())

const enabledModuleCount = computed(() => {
  return [
    props.group.settings.lessonsEnabled,
    props.group.settings.assignmentsEnabled,
    props.group.settings.scheduleEnabled,
    props.group.settings.chatEnabled
  ].filter(Boolean).length + 1
})

const accessLabel = computed(() => {
  if (props.group.accessMode === 'OPEN') {
    return 'Открытая'
  }

  if (props.group.accessMode === 'BY_REQUEST') {
    return 'По заявке'
  }

  return 'Закрытая'
})
</script>

<template>
  <section class="group-hero">
    <div class="group-hero__copy">
      <span class="eyebrow">Учебная группа</span>
      <h1 class="page-title">{{ group.name }}</h1>
      <p class="lead">{{ group.description }}</p>
      <ModuleBadges :settings="group.settings" />
      <div class="group-hero__actions">
        <RouterLink :to="{ name: 'group-workspace', params: { groupId: group.id } }">
          <AppButton size="lg">Открыть группу <ArrowRight :size="18" /></AppButton>
        </RouterLink>
        <AppButton variant="secondary" size="lg">Код {{ group.code }}</AppButton>
      </div>
    </div>

    <div class="group-hero__visual">
      <span>{{ initials }}</span>
    </div>
  </section>

  <section class="group-hero__metrics">
    <MetricTile label="Участников" :value="group.membersCount.toLocaleString('ru-RU')" detail="Активная учебная аудитория" :icon="Users" />
    <MetricTile label="Модулей" :value="enabledModuleCount" detail="Включенные разделы группы" :icon="BookOpen" />
    <MetricTile label="Доступ" :value="accessLabel" detail="Правило вступления" :icon="LockKeyhole" />
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
  align-items: center;
  background:
    radial-gradient(circle at 25% 20%, rgb(255 255 255 / 62%), transparent 32%),
    linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-lg);
  color: #fff;
  display: grid;
  font-size: clamp(4rem, 10vw, 7rem);
  font-weight: 900;
  justify-items: center;
  letter-spacing: 0;
  min-height: 420px;
  overflow: hidden;
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
