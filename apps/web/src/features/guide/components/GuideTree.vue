<script setup lang="ts">
import type { GuideSection, GuideTopic } from '../model/guide.types'

const props = defineProps<{
  sections: GuideSection[]
  activeTopic: GuideTopic
  expandedSectionIds: string[]
}>()

const emit = defineEmits<{
  toggleSection: [sectionId: string]
  selectTopic: [section: GuideSection, topic: GuideTopic]
}>()

function isSectionExpanded(sectionId: string) {
  return props.expandedSectionIds.includes(sectionId)
}
</script>

<template>
  <aside class="guide-tree" aria-label="Пункты обучения">
    <div class="guide-tree__header">
      <span class="eyebrow">Навигация</span>
      <h2>Дерево обучения</h2>
    </div>

    <div class="guide-tree__sections">
      <section v-for="section in sections" :key="section.id" class="guide-tree__section">
        <button
          type="button"
          class="guide-tree__section-button"
          :aria-expanded="isSectionExpanded(section.id)"
          @click="emit('toggleSection', section.id)"
        >
          <span>{{ section.title }}</span>
          <span class="guide-tree__chevron" aria-hidden="true">
            {{ isSectionExpanded(section.id) ? '−' : '+' }}
          </span>
        </button>

        <div v-if="isSectionExpanded(section.id)" class="guide-tree__topics">
          <button
            v-for="topic in section.topics"
            :key="topic.id"
            type="button"
            :class="['guide-tree__topic', { 'guide-tree__topic--active': topic.id === activeTopic.id }]"
            @click="emit('selectTopic', section, topic)"
          >
            {{ topic.title }}
          </button>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.guide-tree {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-panel-border);
  border-left: 0;
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 18px;
  max-height: calc(100vh - 88px);
  overflow: auto;
  padding: 22px;
  position: sticky;
  top: 88px;
}

.guide-tree__header h2 {
  color: var(--color-text);
  font-size: 1.12rem;
  margin: 0;
}

.guide-tree__sections {
  display: grid;
  gap: 8px;
}

.guide-tree__section {
  border-bottom: 1px solid var(--color-divider);
  padding-bottom: 8px;
}

.guide-tree__section:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.guide-tree__section-button {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  font-weight: 850;
  justify-content: space-between;
  min-height: 40px;
  padding: 0;
  text-align: left;
  width: 100%;
}

.guide-tree__chevron {
  align-items: center;
  background: var(--color-surface-low);
  border-radius: 50%;
  color: var(--color-primary);
  display: inline-flex;
  flex: 0 0 auto;
  font-weight: 900;
  height: 26px;
  justify-content: center;
  width: 26px;
}

.guide-tree__topics {
  display: grid;
  gap: 6px;
  padding: 4px 0 8px 12px;
}

.guide-tree__topic {
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.35;
  min-height: 36px;
  padding: 8px 10px;
  text-align: left;
  transition: background-color 160ms ease, color 160ms ease;
}

.guide-tree__topic:hover {
  background: var(--color-surface-low);
  color: var(--color-text);
}

.guide-tree__topic--active,
.guide-tree__topic--active:hover {
  background: var(--color-primary-container);
  color: var(--color-action-primary-text);
}

@media (max-width: 900px) {
  .guide-tree {
    border-left: 1px solid var(--color-panel-border);
    border-radius: var(--radius-lg);
    max-height: none;
    position: static;
  }
}
</style>
