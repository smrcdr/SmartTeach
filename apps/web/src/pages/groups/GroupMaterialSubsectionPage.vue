<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { getMaterialSubsection, type MaterialSubsectionDetails } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { getLessonStatusLabel } from '@/features/groups/lib/status-labels'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const route = useRoute()
const auth = useAuthStore()
const { group } = useGroup()
const groupId = computed(() => String(route.params.groupId ?? ''))
const subsectionId = computed(() => String(route.params.subsectionId ?? ''))
const details = ref<MaterialSubsectionDetails | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(false)
const canManage = computed(() => canManageGroup(group.value))
const sectionNumber = computed(() => details.value?.section.sortOrder ?? 1)
const subsectionNumber = computed(() => details.value?.subsection.sortOrder ?? 1)

async function refresh() {
  if (!groupId.value || !subsectionId.value || !auth.accessToken) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    details.value = await getMaterialSubsection(groupId.value, subsectionId.value, auth.accessToken)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить подраздел'
  } finally {
    isLoading.value = false
  }
}

watch([groupId, subsectionId, () => auth.accessToken], () => void refresh(), { immediate: true })
</script>

<template>
  <main v-if="details" class="page">
    <AppPageHeader
      eyebrow="Материалы"
      :title="details.subsection.title"
      :description="`${details.section.title} · ${sectionNumber}.${subsectionNumber}`"
      align="split"
    >
      <template v-if="canManage" #actions>
        <RouterLink
          :to="{
            name: 'group-lesson-create',
            params: { groupId },
            query: { materialSubsectionId: details.subsection.id }
          }"
        >
          <AppButton>
            <Plus :size="18" />
            Добавить урок
          </AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <section class="subsection-panel">
      <article class="subsection-block">
        <div class="subsection-block__header">
          <span class="subsection-block__number">{{ sectionNumber }}.{{ subsectionNumber }}</span>
          <div>
            <h2>{{ details.subsection.title }}</h2>
            <p>{{ details.lessons.length }} уроков внутри подраздела</p>
          </div>
        </div>

        <div v-if="details.lessons.length > 0" class="lesson-list">
          <RouterLink
            v-for="(lesson, lessonIndex) in details.lessons"
            :key="lesson.id"
            class="lesson-row"
            :to="{ name: 'group-lesson-details', params: { groupId, lessonId: lesson.id } }"
          >
            <span class="lesson-row__number">{{ sectionNumber }}.{{ subsectionNumber }}.{{ lessonIndex + 1 }}</span>
            <span class="lesson-row__title">{{ lesson.title }}</span>
            <StatusPill
              :label="getLessonStatusLabel(lesson.status)"
              :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'"
            />
          </RouterLink>
        </div>

        <EmptyState
          v-else
          title="Уроков пока нет"
          description="Администратор может добавить урок в этот подраздел."
        />
      </article>
    </section>
  </main>

  <main v-else class="page">
    <EmptyState
      :title="isLoading ? 'Загружаем подраздел' : 'Подраздел не загружен'"
      :description="error ?? 'Данные подраздела ожидаются от API.'"
    />
  </main>
</template>

<style scoped>
.subsection-panel {
  display: grid;
  gap: 16px;
}

.subsection-block {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 18px;
  padding: clamp(20px, 4vw, 30px);
}

.subsection-block__header {
  align-items: center;
  border-bottom: 1px solid var(--color-divider);
  display: flex;
  gap: 18px;
  padding-bottom: 18px;
}

.subsection-block__number {
  align-items: center;
  background: var(--color-primary-container);
  border-radius: var(--radius-sm);
  color: var(--color-action-primary-text);
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 1.05rem;
  font-weight: 900;
  height: 52px;
  justify-content: center;
  min-width: 70px;
  padding: 0 12px;
}

.subsection-block h2,
.subsection-block p {
  margin: 0;
}

.subsection-block h2 {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.subsection-block p {
  color: var(--color-text-muted);
  margin-top: 6px;
}

.lesson-list {
  display: grid;
  gap: 10px;
}

.lesson-row {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  display: grid;
  gap: 14px;
  grid-template-columns: 82px minmax(0, 1fr) auto;
  min-height: 62px;
  padding: 13px 16px;
}

.lesson-row:hover {
  background: var(--color-surface-high);
  border-color: var(--color-focus-border);
}

.lesson-row__number {
  color: var(--color-primary);
  font-weight: 900;
}

.lesson-row__title {
  font-weight: 790;
  min-width: 0;
}

@media (max-width: 640px) {
  .subsection-block__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .lesson-row {
    align-items: flex-start;
    grid-template-columns: 1fr;
  }
}
</style>
