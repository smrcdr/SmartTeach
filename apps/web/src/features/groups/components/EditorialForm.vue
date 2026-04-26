<script setup lang="ts">
import AppButton from '@/shared/ui/AppButton.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'

defineProps<{
  titleLabel?: string
  descriptionLabel?: string
  submitLabel?: string
}>()
</script>

<template>
  <form class="editorial-form">
    <AppTextField :label="titleLabel ?? 'Название'" placeholder="Введите название" />
    <AppTextarea :label="descriptionLabel ?? 'Описание'" placeholder="Добавьте подробности" />
    <div class="editorial-form__grid">
      <AppTextField label="Статус" placeholder="Выберите статус" />
      <AppTextField label="Дата" placeholder="ГГГГ-ММ-ДД" />
    </div>
    <div class="editorial-form__actions">
      <AppButton type="submit">{{ submitLabel ?? 'Сохранить' }}</AppButton>
      <AppButton type="button" variant="secondary">Отмена</AppButton>
    </div>
  </form>
</template>

<style scoped>
.editorial-form {
  background: var(--color-surface-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 36px);
}

.editorial-form__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.editorial-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

@media (max-width: 720px) {
  .editorial-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
