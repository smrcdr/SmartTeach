<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import GroupCatalogCard from '@/features/groups/components/GroupCatalogCard.vue'
import { useGroups } from '@/features/groups/composables/useGroups'
import AppButton from '@/shared/ui/AppButton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const { groups, isLoading, error } = useGroups()
</script>

<template>
  <main class="page home-page">
    <section class="home-hero">
      <div>
        <span class="eyebrow">Академическая платформа</span>
        <h1 class="display-title">Учитесь, <br /><span>общайтесь, растите.</span></h1>
      </div>
      <div class="home-hero__aside">
        <p class="lead">Присоединяйтесь к учебным группам, ведите уроки, задания, расписание и чаты в единой рабочей среде.</p>
        <RouterLink to="/catalog">
          <AppButton size="lg">Перейти в каталог <ArrowRight :size="18" /></AppButton>
        </RouterLink>
      </div>
    </section>

    <section class="home-recommendations">
      <div class="home-recommendations__header">
        <div>
          <span class="eyebrow">Академический выбор</span>
          <h2>Рекомендованные группы</h2>
        </div>
      </div>
      <div class="home-recommendations__grid">
        <GroupCatalogCard
          v-for="group in groups.slice(0, 4)"
          :key="group.id"
          :group="group"
          compact
        />
        <EmptyState
          v-if="!isLoading && !error && groups.length === 0"
          title="Группы пока не опубликованы"
          description="Когда в каталоге появятся открытые группы, они будут показаны здесь."
        />
        <EmptyState v-if="error" title="Не удалось загрузить группы" :description="error" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.display-title span {
  color: var(--color-primary);
  font-style: italic;
  font-weight: 300;
}

.home-hero {
  align-items: end;
  display: grid;
  gap: 32px;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 560px);
  margin-bottom: clamp(56px, 9vw, 100px);
}

.home-hero__aside {
  display: grid;
  gap: 24px;
  justify-items: start;
}

.home-recommendations__header {
  align-items: end;
  display: flex;
  justify-content: space-between;
  margin-bottom: 28px;
}

.home-recommendations h2 {
  color: var(--color-text);
  font-size: clamp(1.75rem, 3vw, 2.35rem);
  margin: 0;
}

.home-recommendations__grid {
  display: grid;
  gap: 24px;
}

@media (max-width: 900px) {
  .home-hero {
    align-items: start;
    grid-template-columns: 1fr;
  }
}
</style>
