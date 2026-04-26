<script setup lang="ts">
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page">
    <AppPageHeader eyebrow="Доступ" title="Заявки на вступление" description="Рассматривайте входящие заявки и управляйте доступом к закрытым группам." />
    <ContentList title="Ожидают решения">
      <WorkspaceItem title="Анна Смирнова" description="Хочет присоединиться к группе по рекомендации преподавателя" meta="2 часа назад">
        <template #aside>
          <AppButton size="sm">Принять</AppButton>
          <AppButton size="sm" variant="secondary">Отклонить</AppButton>
        </template>
      </WorkspaceItem>
    </ContentList>
  </main>
</template>
