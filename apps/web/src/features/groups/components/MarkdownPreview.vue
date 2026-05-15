<script setup lang="ts">
import { computed } from 'vue'
import { renderLessonContent } from '@/features/groups/lib/markdown'

const props = defineProps<{
  content?: string | null
  emptyText?: string
  handleLessonLinks?: boolean
}>()

const emit = defineEmits<{
  'lesson-link': [lessonId: string]
}>()

const html = computed(() => renderLessonContent(props.content))

function handleClick(event: MouseEvent) {
  if (!props.handleLessonLinks) {
    return
  }

  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const anchor = target.closest('a[data-lesson-id]')
  const lessonId = anchor?.getAttribute('data-lesson-id')

  if (!lessonId) {
    return
  }

  event.preventDefault()
  emit('lesson-link', lessonId)
}
</script>

<template>
  <div v-if="html" class="markdown-preview" @click="handleClick" v-html="html" />
  <p v-else class="markdown-preview markdown-preview--empty">{{ emptyText ?? 'Материал пока не заполнен.' }}</p>
</template>

<style scoped>
.markdown-preview {
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.72;
  overflow-wrap: anywhere;
}

.markdown-preview--empty {
  color: var(--color-text-muted);
  margin: 0;
}

.markdown-preview :deep(*) {
  margin-top: 0;
}

.markdown-preview :deep(*:last-child) {
  margin-bottom: 0;
}

.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
  color: var(--color-primary);
  line-height: 1.24;
  margin: 1.2em 0 0.45em;
}

.markdown-preview :deep(p),
.markdown-preview :deep(ul),
.markdown-preview :deep(ol),
.markdown-preview :deep(blockquote),
.markdown-preview :deep(pre) {
  margin-bottom: 1em;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 1.35rem;
}

.markdown-preview :deep(li + li) {
  margin-top: 0.35em;
}

.markdown-preview :deep(a) {
  color: var(--color-primary);
  font-weight: 760;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid var(--color-primary-container);
  color: var(--color-text-muted);
  padding-left: 16px;
}

.markdown-preview :deep(code) {
  background: var(--color-surface-low);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 0.92em;
  padding: 2px 6px;
}

.markdown-preview :deep(pre) {
  background: var(--color-surface-low);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-md);
  overflow-x: auto;
  padding: 16px;
}

.markdown-preview :deep(pre code) {
  background: transparent;
  border: 0;
  padding: 0;
}
</style>
