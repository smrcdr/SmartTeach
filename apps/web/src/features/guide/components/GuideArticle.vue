<script setup lang="ts">
import type { GuideSection, GuideTopic } from '../model/guide.types'

defineProps<{
  section: GuideSection
  topic: GuideTopic
}>()
</script>

<template>
  <article class="guide-content">
    <div class="guide-content__section-label">{{ section.title }}</div>
    <h2>{{ topic.title }}</h2>

    <div class="guide-content__intro">
      <section>
        <h3>Для чего используется</h3>
        <p>{{ topic.purpose }}</p>
      </section>
      <section>
        <h3>Как пользоваться</h3>
        <p>{{ topic.usage }}</p>
      </section>
    </div>

    <div class="guide-content__block">
      <h3>Что помогает сделать</h3>
      <ul>
        <li v-for="item in topic.helps" :key="item">{{ item }}</li>
      </ul>
    </div>

    <div class="guide-content__block">
      <h3>Порядок действий</h3>
      <ol>
        <li v-for="step in topic.steps" :key="step">{{ step }}</li>
      </ol>
    </div>

    <div v-if="topic.tips?.length" class="guide-content__block guide-content__block--muted">
      <h3>Полезно знать</h3>
      <ul>
        <li v-for="tip in topic.tips" :key="tip">{{ tip }}</li>
      </ul>
    </div>

    <footer class="guide-content__footer">
      <span>{{ section.description }}</span>
    </footer>
  </article>
</template>

<style scoped>
.guide-content {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 22px;
  min-height: 620px;
  padding: clamp(24px, 4vw, 42px);
}

.guide-content__section-label {
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.guide-content h2 {
  color: var(--color-text);
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: 0;
  line-height: 1;
  margin: 0;
}

.guide-content__intro {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.guide-content__intro section,
.guide-content__block {
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  display: grid;
  gap: 12px;
  padding: 20px;
}

.guide-content__block--muted {
  background: var(--color-surface);
}

.guide-content h3 {
  color: var(--color-primary);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.guide-content p {
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
}

.guide-content ol,
.guide-content ul {
  color: var(--color-text);
  display: grid;
  gap: 10px;
  line-height: 1.6;
  margin: 0;
  padding-left: 22px;
}

.guide-content li::marker {
  color: var(--color-primary);
  font-weight: 850;
}

.guide-content__footer {
  border-top: 1px solid var(--color-divider);
  color: var(--color-text-muted);
  font-size: 0.92rem;
  line-height: 1.6;
  margin-top: auto;
  padding-top: 18px;
}

@media (max-width: 760px) {
  .guide-content__intro {
    grid-template-columns: 1fr;
  }
}
</style>
