<script setup lang="ts">
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader
      eyebrow="Доступ"
      title="Вступить по коду"
      description="Введите код группы, который выдал преподаватель или администратор."
    />
    <form class="join-form surface-panel">
      <AppTextField label="Код группы" placeholder="Введите код" />
      <AppButton type="submit">Найти группу</AppButton>
    </form>
  </main>
</template>

<style scoped>
.join-form {
  display: grid;
  gap: 18px;
  max-width: 560px;
  padding: 28px;
}
</style>
