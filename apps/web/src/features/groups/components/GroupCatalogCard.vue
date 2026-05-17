<script setup lang="ts">
import { Clock, Users } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Group } from '../api/groups.api'
import AppButton from '@/shared/ui/AppButton.vue'
import ModuleBadges from './ModuleBadges.vue'

const props = defineProps<{
  group: Group
  compact?: boolean
}>()

const initials = computed(() => props.group.name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase())

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
  <article :class="['group-card', compact && 'group-card--compact']">
    <RouterLink :to="{ name: 'group-preview', params: { groupId: group.id } }" class="group-card__media">
      <img
        v-if="group.catalogImageUrl"
        class="group-card__image"
        :src="group.catalogImageUrl"
        :alt="group.name"
      >
      <img
        v-else-if="group.avatarUrl"
        class="group-card__image group-card__image--avatar"
        :src="group.avatarUrl"
        :alt="group.name"
      >
      <span v-else class="group-card__initials">{{ initials }}</span>
      <span v-if="group.viewerMembershipRole" class="group-card__flag">Вы участник</span>
    </RouterLink>

    <div class="group-card__content">
      <div>
        <div class="group-card__title-row">
          <h2>{{ group.name }}</h2>
          <span>{{ group.code }}</span>
        </div>
        <p>{{ group.description }}</p>
        <ModuleBadges :settings="group.settings" />
      </div>

      <div class="group-card__footer">
        <div class="group-card__meta">
          <span><Users :size="18" /> {{ group.membersCount.toLocaleString('ru-RU') }} участников</span>
          <span><Clock :size="18" /> {{ accessLabel }}</span>
        </div>
        <RouterLink :to="{ name: 'group-preview', params: { groupId: group.id } }">
          <AppButton>Подробнее</AppButton>
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.group-card {
  background: var(--color-surface-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  display: grid;
  grid-template-columns: minmax(260px, 360px) 1fr;
  overflow: hidden;
  transition: box-shadow 180ms ease, transform 180ms ease;
}

.group-card:hover {
  box-shadow: var(--shadow-ambient);
  transform: translateY(-2px);
}

.group-card__media {
  align-items: center;
  background: var(--color-primary);
  border-bottom: 1px solid var(--color-divider);
  display: grid;
  justify-items: center;
  min-height: 240px;
  overflow: hidden;
  position: relative;
}

.group-card__initials {
  color: #fff;
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 900;
  letter-spacing: 0;
}

.group-card__image {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.group-card__image--avatar {
  height: min(56%, 160px);
  width: min(56%, 160px);
  border-radius: 999px;
}

.group-card__flag {
  background: rgb(255 255 255 / 88%);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  padding: 7px 9px;
  position: absolute;
  right: 14px;
  text-transform: uppercase;
  top: 14px;
}

.group-card__content {
  display: flex;
  flex-direction: column;
  gap: 28px;
  justify-content: space-between;
  padding: 30px;
}

.group-card__title-row {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.group-card h2 {
  color: var(--color-primary);
  font-size: 1.55rem;
  line-height: 1.12;
  margin: 0;
}

.group-card__title-row span {
  background: var(--color-secondary-container);
  border-radius: var(--radius-xs);
  color: #424464;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.76rem;
  font-weight: 800;
  padding: 7px 9px;
  white-space: nowrap;
}

.group-card p {
  color: var(--color-text-muted);
  line-height: 1.65;
  margin: 12px 0 22px;
}

.group-card__footer {
  align-items: center;
  display: flex;
  gap: 20px;
  justify-content: space-between;
}

.group-card__meta {
  color: var(--color-text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  font-size: 0.9rem;
  font-weight: 650;
}

.group-card__meta span {
  align-items: center;
  display: inline-flex;
  gap: 7px;
}

.group-card--compact {
  grid-template-columns: minmax(220px, 320px) 1fr;
}

@media (max-width: 840px) {
  .group-card,
  .group-card--compact {
    grid-template-columns: 1fr;
  }

  .group-card__footer,
  .group-card__title-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
