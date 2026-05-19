<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/shared/ui/AppButton.vue'

const props = defineProps<{
  title: string
  description: string
  previewUrl?: string | null
  placeholder: string
  kind: 'avatar' | 'catalog'
  clearVisible?: boolean
}>()

const emit = defineEmits<{
  select: [file: File | null]
}>()

const input = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  input.value?.click()
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('select', target.files?.[0] ?? null)
  target.value = ''
}

function clearSelection() {
  emit('select', null)

  if (input.value) {
    input.value.value = ''
  }
}
</script>

<template>
  <div class="group-image-field">
    <div :class="[`group-image-field__${kind}`]">
      <img v-if="previewUrl" :src="previewUrl" alt="">
      <span v-else>{{ placeholder }}</span>
    </div>
    <div class="group-image-field__body">
      <strong>{{ title }}</strong>
      <p>{{ description }}</p>
      <div class="group-image-field__actions">
        <AppButton type="button" variant="secondary" @click="openFilePicker">Выбрать</AppButton>
        <button v-if="clearVisible" type="button" @click="clearSelection">Убрать</button>
      </div>
      <input ref="input" type="file" accept="image/*" @change="handleChange">
    </div>
  </div>
</template>

<style scoped>
.group-image-field {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-md);
  display: grid;
  gap: 16px;
  grid-template-columns: 112px 1fr;
  padding: 14px;
}

.group-image-field__avatar,
.group-image-field__catalog {
  align-items: center;
  background: var(--color-primary);
  color: #fff;
  display: grid;
  font-weight: 900;
  justify-items: center;
  overflow: hidden;
}

.group-image-field__avatar {
  aspect-ratio: 1;
  border-radius: 999px;
  font-size: 2rem;
}

.group-image-field__catalog {
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-md);
  font-size: 0.86rem;
}

.group-image-field img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.group-image-field__body {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.group-image-field__body strong {
  color: var(--color-text);
}

.group-image-field__body p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.45;
  margin: 0;
}

.group-image-field__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.group-image-field__actions button:not(.app-button) {
  background: transparent;
  border: 0;
  color: var(--color-text-muted);
  cursor: pointer;
  font-weight: 780;
  padding: 0;
}

.group-image-field__actions button:not(.app-button):hover {
  color: var(--color-danger);
}

.group-image-field input {
  display: none;
}

@media (max-width: 720px) {
  .group-image-field {
    grid-template-columns: 1fr;
  }

  .group-image-field__avatar,
  .group-image-field__catalog {
    max-width: 180px;
  }
}
</style>
