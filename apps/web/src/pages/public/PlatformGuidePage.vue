<script setup lang="ts">
import { computed, ref } from 'vue'
import GuideArticle from '@/features/guide/components/GuideArticle.vue'
import GuideTree from '@/features/guide/components/GuideTree.vue'
import { guideSections } from '@/features/guide/model/guide.sections'
import type { GuideSection, GuideTopic } from '@/features/guide/model/guide.types'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'

const expandedSectionIds = ref<string[]>(guideSections.map((section) => section.id))
const activeTopicId = ref(guideSections[0].topics[0].id)

const activeSection = computed(() => {
  return guideSections.find((section) => section.topics.some((topic) => topic.id === activeTopicId.value)) ?? guideSections[0]
})

const activeTopic = computed(() => {
  return activeSection.value.topics.find((topic) => topic.id === activeTopicId.value) ?? activeSection.value.topics[0]
})

function isSectionExpanded(sectionId: string) {
  return expandedSectionIds.value.includes(sectionId)
}

function toggleSection(sectionId: string) {
  expandedSectionIds.value = isSectionExpanded(sectionId)
    ? expandedSectionIds.value.filter((id) => id !== sectionId)
    : [...expandedSectionIds.value, sectionId]
}

function selectTopic(section: GuideSection, topic: GuideTopic) {
  if (!isSectionExpanded(section.id)) {
    expandedSectionIds.value = [...expandedSectionIds.value, section.id]
  }

  activeTopicId.value = topic.id
}
</script>

<template>
  <main class="guide-page">
    <div class="guide-page__header">
      <AppPageHeader
        eyebrow="Обучение"
        title="Как пользоваться платформой"
        description="Подробные, но коротко разбитые инструкции по основным возможностям SmarTeach. Выберите раздел слева и откройте нужный подпункт."
      />
    </div>

    <section class="guide-layout" aria-label="Обучение пользованию платформой">
      <GuideTree
        :sections="guideSections"
        :active-topic="activeTopic"
        :expanded-section-ids="expandedSectionIds"
        @toggle-section="toggleSection"
        @select-topic="selectTopic"
      />

      <div class="guide-layout__content">
        <GuideArticle :section="activeSection" :topic="activeTopic" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.guide-page {
  padding: 112px 0 72px;
}

.guide-page__header {
  margin: 0 auto;
  padding: 0 var(--space-page-x);
  width: min(100%, var(--max-page));
}

.guide-page :deep(.page-header) {
  margin-bottom: 36px;
}

.guide-layout {
  align-items: start;
  display: grid;
  gap: 32px;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
}

.guide-layout__content {
  max-width: 980px;
  padding-right: var(--space-page-x);
}

@media (max-width: 900px) {
  .guide-page {
    padding: 96px var(--space-page-x) 72px;
  }

  .guide-page__header {
    padding: 0;
  }

  .guide-layout {
    grid-template-columns: 1fr;
  }

  .guide-layout__content {
    max-width: none;
    padding-right: 0;
  }
}
</style>
