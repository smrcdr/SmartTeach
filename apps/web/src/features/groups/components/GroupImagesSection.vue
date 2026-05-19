<script setup lang="ts">
import GroupImageField from './GroupImageField.vue'

defineProps<{
  headingId: string
  avatarPreviewUrl?: string | null
  avatarPlaceholder: string
  avatarClearVisible?: boolean
  catalogPreviewUrl?: string | null
  catalogClearVisible?: boolean
}>()

defineEmits<{
  'avatar-select': [file: File | null]
  'catalog-select': [file: File | null]
}>()
</script>

<template>
  <section class="group-images" :aria-labelledby="headingId">
    <h2 :id="headingId">Изображения</h2>
    <div class="group-images__grid">
      <GroupImageField
        kind="avatar"
        title="Аватар группы"
        description="Показывается в карточках и внутри группы."
        :preview-url="avatarPreviewUrl"
        :placeholder="avatarPlaceholder"
        :clear-visible="avatarClearVisible"
        @select="$emit('avatar-select', $event)"
      />
      <GroupImageField
        kind="catalog"
        title="Картинка каталога"
        description="Отображается как основное изображение в каталоге групп."
        :preview-url="catalogPreviewUrl"
        placeholder="Каталог"
        :clear-visible="catalogClearVisible"
        @select="$emit('catalog-select', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.group-images {
  display: grid;
  gap: 14px;
}

.group-images h2 {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.group-images__grid {
  display: grid;
  gap: 12px;
}
</style>
