<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link,
  Link2,
  List,
  Quote,
  Underline,
  X
} from 'lucide-vue-next'
import {
  listLessons,
  listMaterials,
  type Lesson,
  type MaterialSection,
  type MaterialSubsection
} from '@/features/groups/api/groups.api'
import { renderLessonContent, sanitizeRichHtml } from '@/features/groups/lib/markdown'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'

const props = defineProps<{
  modelValue?: string
  name?: string
  label?: string
  placeholder?: string
  groupId?: string
  token?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const notifications = useNotificationStore()
const editor = ref<HTMLElement | null>(null)
const savedSelection = ref<Range | null>(null)
const isFocused = ref(false)
const isLessonDialogOpen = ref(false)
const isLessonDialogLoading = ref(false)
const lessonDialogError = ref<string | null>(null)
const materials = ref<MaterialSection[]>([])
const lessons = ref<Lesson[]>([])
const selectedSectionId = ref('')
const selectedSubsectionId = ref('')
const selectedLessonId = ref('')
const lastAppliedValue = ref('')
const isEmpty = ref(true)

const sectionOptions = computed(() => materials.value)
const subsectionOptions = computed<MaterialSubsection[]>(() => {
  const section = materials.value.find((item) => item.id === selectedSectionId.value)

  if (!section) {
    return []
  }

  return section.subsections
})
const lessonOptions = computed(() =>
  lessons.value.filter((lesson) => lesson.materialSubsectionId === selectedSubsectionId.value)
)
const selectedLesson = computed(() =>
  lessonOptions.value.find((lesson) => lesson.id === selectedLessonId.value) ?? null
)
const canInsertLessonLink = computed(() => Boolean(props.groupId && props.token))

function normalizeEditorHtml(value: string | null | undefined) {
  return renderLessonContent(value)
}

function isVisuallyEmpty(target: HTMLElement) {
  return target.textContent?.trim().length === 0 && target.querySelector('img, iframe') === null
}

function updateEmptyState() {
  if (!editor.value) {
    isEmpty.value = true
    return
  }

  isEmpty.value = isVisuallyEmpty(editor.value)
}

function applyModelValue(value: string | undefined) {
  const target = editor.value

  if (!target) {
    return
  }

  const html = normalizeEditorHtml(value)

  if (lastAppliedValue.value === (value ?? '') && target.innerHTML === html) {
    return
  }

  if (isFocused.value && lastAppliedValue.value === (value ?? '')) {
    return
  }

  target.innerHTML = html
  lastAppliedValue.value = value ?? ''
  updateEmptyState()
}

function emitFromEditor() {
  const target = editor.value

  if (!target) {
    return
  }

  const html = isVisuallyEmpty(target) ? '' : sanitizeRichHtml(target.innerHTML)
  lastAppliedValue.value = html
  emit('update:modelValue', html)
  updateEmptyState()
}

function focusEditor() {
  editor.value?.focus()
}

function saveSelection() {
  const selection = window.getSelection()
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null

  if (!range || !editor.value?.contains(range.commonAncestorContainer)) {
    return
  }

  savedSelection.value = range.cloneRange()
}

function restoreSelection() {
  if (!savedSelection.value) {
    focusEditor()
    return
  }

  const selection = window.getSelection()

  selection?.removeAllRanges()
  selection?.addRange(savedSelection.value)
  focusEditor()
}

function runCommand(command: string, value?: string) {
  restoreSelection()
  document.execCommand(command, false, value)
  emitFromEditor()
  saveSelection()
}

function setBlock(tagName: string) {
  runCommand('formatBlock', tagName)
}

function createExternalLink() {
  const href = window.prompt('Введите ссылку')

  if (!href) {
    return
  }

  runCommand('createLink', href)
}

function insertInlineCode() {
  restoreSelection()

  const selection = window.getSelection()
  const selectedText = selection?.toString() || 'код'
  const code = document.createElement('code')

  code.textContent = selectedText
  document.execCommand('insertHTML', false, code.outerHTML)
  emitFromEditor()
  saveSelection()
}

async function openLessonDialog() {
  if (!props.groupId || !props.token) {
    notifications.error('Сначала откройте редактор внутри группы')
    return
  }

  saveSelection()
  isLessonDialogOpen.value = true
  isLessonDialogLoading.value = true
  lessonDialogError.value = null
  selectedSectionId.value = ''
  selectedSubsectionId.value = ''
  selectedLessonId.value = ''

  try {
    const [nextMaterials, nextLessons] = await Promise.all([
      listMaterials(props.groupId, props.token),
      listLessons(props.groupId, props.token)
    ])

    materials.value = nextMaterials
    lessons.value = nextLessons
  } catch (caught) {
    lessonDialogError.value = caught instanceof Error ? caught.message : 'Не удалось загрузить уроки'
  } finally {
    isLessonDialogLoading.value = false
  }
}

function closeLessonDialog() {
  isLessonDialogOpen.value = false
}

function insertLessonLink() {
  if (!selectedLesson.value || !props.groupId) {
    return
  }

  restoreSelection()

  const anchor = document.createElement('a')

  anchor.href = `/groups/${props.groupId}/workspace/lessons/${selectedLesson.value.id}`
  anchor.dataset.groupId = props.groupId
  anchor.dataset.lessonId = selectedLesson.value.id
  anchor.textContent = selectedLesson.value.title

  document.execCommand('insertHTML', false, `${anchor.outerHTML}&nbsp;`)
  emitFromEditor()
  saveSelection()
  closeLessonDialog()
}

function handlePaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text/plain')

  if (!text) {
    return
  }

  event.preventDefault()
  document.execCommand('insertText', false, text)
  emitFromEditor()
}

watch(
  () => props.modelValue,
  (value) => {
    void nextTick(() => applyModelValue(value))
  },
  { immediate: true }
)

watch(selectedSectionId, () => {
  selectedSubsectionId.value = ''
  selectedLessonId.value = ''
})

watch(selectedSubsectionId, () => {
  selectedLessonId.value = ''
})

onMounted(() => {
  applyModelValue(props.modelValue)
})
</script>

<template>
  <section class="rich-editor">
    <header class="rich-editor__header">
      <span class="rich-editor__label">{{ label ?? 'Содержимое' }}</span>
      <div class="rich-editor__tools" aria-label="Форматирование">
        <button type="button" title="Заголовок" @mousedown.prevent @click="setBlock('h2')">
          <Heading2 :size="18" />
        </button>
        <button type="button" title="Жирный" @mousedown.prevent @click="runCommand('bold')">
          <Bold :size="18" />
        </button>
        <button type="button" title="Курсив" @mousedown.prevent @click="runCommand('italic')">
          <Italic :size="18" />
        </button>
        <button type="button" title="Подчеркнуть" @mousedown.prevent @click="runCommand('underline')">
          <Underline :size="18" />
        </button>
        <button type="button" title="Список" @mousedown.prevent @click="runCommand('insertUnorderedList')">
          <List :size="18" />
        </button>
        <button type="button" title="Цитата" @mousedown.prevent @click="setBlock('blockquote')">
          <Quote :size="18" />
        </button>
        <button type="button" title="Код" @mousedown.prevent @click="insertInlineCode">
          <Code :size="18" />
        </button>
        <button type="button" title="Ссылка" @mousedown.prevent @click="createExternalLink">
          <Link :size="18" />
        </button>
        <button
          type="button"
          title="Вставить ссылку на урок"
          :disabled="!canInsertLessonLink"
          @mousedown.prevent
          @click="openLessonDialog"
        >
          <Link2 :size="18" />
        </button>
      </div>
    </header>

    <input v-if="name" type="hidden" :name="name" :value="modelValue ?? ''" />
    <div class="rich-editor__canvas">
      <div
        ref="editor"
        class="rich-editor__surface"
        :class="{ 'rich-editor__surface--empty': isEmpty }"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        :aria-label="label ?? 'Содержимое'"
        :data-placeholder="placeholder ?? 'Начните писать материал...'"
        @focus="isFocused = true"
        @blur="isFocused = false; emitFromEditor()"
        @input="emitFromEditor"
        @keyup="saveSelection"
        @mouseup="saveSelection"
        @paste="handlePaste"
      />
    </div>

    <div
      v-if="isLessonDialogOpen"
      class="lesson-link-dialog"
      role="presentation"
      @click.self="closeLessonDialog"
    >
      <section
        class="lesson-link-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-link-dialog-title"
      >
        <header class="lesson-link-dialog__header">
          <div>
            <span class="lesson-link-dialog__eyebrow">Ссылка на урок</span>
            <h2 id="lesson-link-dialog-title">Выберите материал</h2>
          </div>
          <button class="lesson-link-dialog__close" type="button" aria-label="Закрыть" @click="closeLessonDialog">
            <X :size="18" />
          </button>
        </header>

        <p v-if="lessonDialogError" class="lesson-link-dialog__error">{{ lessonDialogError }}</p>
        <p v-else-if="isLessonDialogLoading" class="lesson-link-dialog__muted">Загружаем структуру материалов.</p>
        <div v-else-if="sectionOptions.length > 0" class="lesson-link-dialog__grid">
          <label>
            <span>Раздел</span>
            <select v-model="selectedSectionId">
              <option value="" disabled>Выберите раздел</option>
              <option v-for="section in sectionOptions" :key="section.id" :value="section.id">
                {{ section.title }}
              </option>
            </select>
          </label>
          <label v-if="selectedSectionId">
            <span>Подраздел</span>
            <select v-model="selectedSubsectionId">
              <option value="" disabled>Выберите подраздел</option>
              <option v-for="subsection in subsectionOptions" :key="subsection.id" :value="subsection.id">
                {{ subsection.title }}
              </option>
            </select>
            <small v-if="subsectionOptions.length === 0">В этом разделе пока нет подразделов.</small>
          </label>
          <label v-if="selectedSubsectionId">
            <span>Урок</span>
            <select v-model="selectedLessonId">
              <option value="" disabled>Выберите урок</option>
              <option v-for="lesson in lessonOptions" :key="lesson.id" :value="lesson.id">
                {{ lesson.title }}
              </option>
            </select>
            <small v-if="lessonOptions.length === 0">В этом подразделе пока нет уроков.</small>
          </label>
        </div>
        <p v-else class="lesson-link-dialog__muted">В группе пока нет разделов материалов.</p>

        <div class="lesson-link-dialog__actions">
          <AppButton
            type="button"
            :disabled="isLessonDialogLoading || !selectedLesson"
            @click="insertLessonLink"
          >
            Вставить ссылку
          </AppButton>
          <AppButton type="button" variant="secondary" @click="closeLessonDialog">Отмена</AppButton>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.rich-editor {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-lg);
  display: grid;
  overflow: hidden;
}

.rich-editor__header {
  align-items: center;
  border-bottom: 1px solid var(--color-divider);
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 14px 16px;
}

.rich-editor__label {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rich-editor__tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rich-editor__tools button {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
  width: 36px;
}

.rich-editor__tools button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.rich-editor__tools button:not(:disabled):hover,
.rich-editor__tools button:not(:disabled):focus-visible {
  background: var(--color-surface-highest);
  border-color: var(--color-focus-border);
  color: var(--color-primary);
  outline: none;
}

.rich-editor__canvas {
  background: var(--color-surface-low);
  padding: clamp(18px, 2.4vw, 28px);
}

.rich-editor__surface {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  color: var(--color-text);
  line-height: 1.72;
  min-height: min(72vh, 760px);
  outline: none;
  overflow-wrap: anywhere;
  padding: clamp(22px, 3vw, 34px);
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.rich-editor__surface:focus {
  background: var(--color-surface-highest);
  border-color: var(--color-focus-border);
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}

.rich-editor__surface--empty::before {
  color: var(--color-placeholder);
  content: attr(data-placeholder);
  pointer-events: none;
}

.rich-editor__surface :deep(*) {
  margin-top: 0;
}

.rich-editor__surface :deep(*:last-child) {
  margin-bottom: 0;
}

.rich-editor__surface :deep(h2),
.rich-editor__surface :deep(h3),
.rich-editor__surface :deep(h4) {
  color: var(--color-primary);
  line-height: 1.24;
  margin: 1.2em 0 0.45em;
}

.rich-editor__surface :deep(p),
.rich-editor__surface :deep(ul),
.rich-editor__surface :deep(ol),
.rich-editor__surface :deep(blockquote),
.rich-editor__surface :deep(pre) {
  margin-bottom: 1em;
}

.rich-editor__surface :deep(ul),
.rich-editor__surface :deep(ol) {
  padding-left: 1.35rem;
}

.rich-editor__surface :deep(a) {
  color: var(--color-primary);
  font-weight: 760;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.rich-editor__surface :deep(blockquote) {
  border-left: 3px solid var(--color-primary-container);
  color: var(--color-text-muted);
  padding-left: 16px;
}

.rich-editor__surface :deep(code) {
  background: var(--color-surface-low);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 0.92em;
  padding: 2px 6px;
}

.lesson-link-dialog {
  align-items: center;
  background: rgb(0 0 0 / 34%);
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  padding: 24px;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 95;
}

.lesson-link-dialog__panel {
  background: var(--color-menu-surface);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 20px;
  max-width: 760px;
  padding: 28px;
  width: min(100%, 760px);
}

.lesson-link-dialog__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.lesson-link-dialog__eyebrow,
.lesson-link-dialog__grid span {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.lesson-link-dialog h2,
.lesson-link-dialog p {
  margin: 0;
}

.lesson-link-dialog h2 {
  color: var(--color-text);
  font-size: 1.45rem;
  line-height: 1.15;
  margin-top: 6px;
}

.lesson-link-dialog__close {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.lesson-link-dialog__close:hover {
  background: var(--color-surface-highest);
  color: var(--color-primary);
}

.lesson-link-dialog__grid {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr);
  max-width: 520px;
}

.lesson-link-dialog__grid label {
  display: grid;
  gap: 8px;
}

.lesson-link-dialog__grid small {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.35;
}

.lesson-link-dialog__grid select {
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  color: var(--color-text);
  min-height: 48px;
  outline: none;
  padding: 0 14px;
}

.lesson-link-dialog__grid select:focus {
  border-color: var(--color-focus-border);
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}

.lesson-link-dialog__muted {
  color: var(--color-text-muted);
}

.lesson-link-dialog__error {
  color: var(--color-error);
  font-weight: 720;
}

.lesson-link-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 760px) {
  .rich-editor__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .rich-editor__surface {
    min-height: 520px;
  }

  .lesson-link-dialog__grid {
    max-width: none;
  }
}
</style>
