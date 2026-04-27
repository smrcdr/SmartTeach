<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Bold, Code, Eye, Heading2, Italic, Link, List, Quote } from 'lucide-vue-next'
import MarkdownPreview from './MarkdownPreview.vue'

const props = defineProps<{
  modelValue?: string
  name?: string
  label?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textarea = ref<HTMLTextAreaElement | null>(null)

function update(value: string) {
  emit('update:modelValue', value)
}

function replaceSelection(nextValue: string, selectionStart: number, selectionEnd: number) {
  update(nextValue)

  void nextTick(() => {
    textarea.value?.focus()
    textarea.value?.setSelectionRange(selectionStart, selectionEnd)
  })
}

function wrapSelection(prefix: string, suffix: string, fallback: string) {
  const target = textarea.value
  const value = props.modelValue ?? ''

  if (!target) {
    update(`${value}${prefix}${fallback}${suffix}`)
    return
  }

  const selected = value.slice(target.selectionStart, target.selectionEnd) || fallback
  const nextValue = `${value.slice(0, target.selectionStart)}${prefix}${selected}${suffix}${value.slice(target.selectionEnd)}`
  const cursorStart = target.selectionStart + prefix.length
  const cursorEnd = cursorStart + selected.length
  replaceSelection(nextValue, cursorStart, cursorEnd)
}

function prefixSelection(prefix: string, fallback: string) {
  const target = textarea.value
  const value = props.modelValue ?? ''

  if (!target) {
    update(`${value}${prefix}${fallback}`)
    return
  }

  const selected = value.slice(target.selectionStart, target.selectionEnd) || fallback
  const replacement = selected
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n')
  const nextValue = `${value.slice(0, target.selectionStart)}${replacement}${value.slice(target.selectionEnd)}`
  replaceSelection(nextValue, target.selectionStart + prefix.length, target.selectionStart + replacement.length)
}
</script>

<template>
  <section class="markdown-editor">
    <header class="markdown-editor__header">
      <span class="markdown-editor__label">{{ label ?? 'Содержимое' }}</span>
      <div class="markdown-editor__tools" aria-label="Форматирование">
        <button type="button" title="Заголовок" @click="prefixSelection('## ', 'Заголовок')">
          <Heading2 :size="18" />
        </button>
        <button type="button" title="Жирный" @click="wrapSelection('**', '**', 'важное')">
          <Bold :size="18" />
        </button>
        <button type="button" title="Курсив" @click="wrapSelection('*', '*', 'акцент')">
          <Italic :size="18" />
        </button>
        <button type="button" title="Список" @click="prefixSelection('- ', 'пункт')">
          <List :size="18" />
        </button>
        <button type="button" title="Цитата" @click="prefixSelection('> ', 'цитата')">
          <Quote :size="18" />
        </button>
        <button type="button" title="Код" @click="wrapSelection('`', '`', 'код')">
          <Code :size="18" />
        </button>
        <button type="button" title="Ссылка" @click="wrapSelection('[', '](https://example.com)', 'текст')">
          <Link :size="18" />
        </button>
      </div>
    </header>

    <div class="markdown-editor__body">
      <textarea
        ref="textarea"
        :name="name"
        class="markdown-editor__textarea"
        :value="modelValue"
        :placeholder="placeholder"
        rows="18"
        @input="update(($event.target as HTMLTextAreaElement).value)"
      />
      <aside class="markdown-editor__preview" aria-label="Предпросмотр">
        <div class="markdown-editor__preview-label">
          <Eye :size="16" />
          <span>Предпросмотр</span>
        </div>
        <MarkdownPreview :content="modelValue" />
      </aside>
    </div>
  </section>
</template>

<style scoped>
.markdown-editor {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-lg);
  display: grid;
  overflow: hidden;
}

.markdown-editor__header {
  align-items: center;
  border-bottom: 1px solid var(--color-divider);
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 14px 16px;
}

.markdown-editor__label,
.markdown-editor__preview-label {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.markdown-editor__tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.markdown-editor__tools button {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 34px;
  justify-content: center;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
  width: 34px;
}

.markdown-editor__tools button:hover,
.markdown-editor__tools button:focus-visible {
  background: var(--color-surface-highest);
  border-color: var(--color-focus-border);
  color: var(--color-primary);
  outline: none;
}

.markdown-editor__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.82fr);
  min-height: 540px;
}

.markdown-editor__textarea {
  background: var(--color-surface-low);
  border: 0;
  border-right: 1px solid var(--color-divider);
  color: var(--color-text);
  min-height: 540px;
  outline: none;
  padding: 22px;
  resize: vertical;
  width: 100%;
}

.markdown-editor__textarea::placeholder {
  color: var(--color-placeholder);
}

.markdown-editor__textarea:focus {
  background: var(--color-surface-highest);
}

.markdown-editor__preview {
  background: var(--color-surface-lowest);
  display: grid;
  gap: 14px;
  grid-template-rows: auto 1fr;
  min-width: 0;
  padding: 20px;
}

.markdown-editor__preview-label {
  align-items: center;
  display: inline-flex;
  gap: 8px;
}

@media (max-width: 980px) {
  .markdown-editor__body {
    grid-template-columns: 1fr;
  }

  .markdown-editor__textarea {
    border-right: 0;
    border-bottom: 1px solid var(--color-divider);
    min-height: 360px;
  }
}

@media (max-width: 620px) {
  .markdown-editor__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
