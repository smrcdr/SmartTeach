<script setup lang="ts">
import { UserPlus, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { getGroupByCode, type Group } from '@/features/groups/api/groups.api'
import GroupCatalogCard from '@/features/groups/components/GroupCatalogCard.vue'
import { useGroups } from '@/features/groups/composables/useGroups'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const search = ref('')
const code = ref('')
const foundGroup = ref<Group | null>(null)
const hasSearched = ref(false)
const isJoinModalOpen = ref(false)
const isSearchingByCode = ref(false)
const auth = useAuthStore()
const { groups, isLoading, error } = useGroups()

const filteredGroups = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) {
    return groups.value
  }

  return groups.value.filter((group) => {
    return `${group.name} ${group.description ?? ''} ${group.code}`.toLowerCase().includes(query)
  })
})

const codeQuery = computed(() => code.value.trim())
const isGroupNotFound = computed(() => hasSearched.value && !isSearchingByCode.value && !foundGroup.value)

function openJoinModal() {
  code.value = ''
  foundGroup.value = null
  hasSearched.value = false
  isJoinModalOpen.value = true
}

function closeJoinModal() {
  isJoinModalOpen.value = false
}

async function findGroupByCode() {
  if (!codeQuery.value) {
    return
  }

  isSearchingByCode.value = true
  hasSearched.value = false
  foundGroup.value = null
  try {
    foundGroup.value = await getGroupByCode(codeQuery.value, auth.accessToken)
  } catch {
    foundGroup.value = null
  } finally {
    hasSearched.value = true
    isSearchingByCode.value = false
  }
}
</script>

<template>
  <main class="page catalog-page">
    <AppPageHeader
      eyebrow="Каталог"
      title="Каталог групп"
      description="Исследуйте коллекцию образовательных программ, созданных для глубокого погружения в дисциплины."
      align="split"
    >
      <template #actions>
        <button type="button" class="catalog-page__join-button" @click="openJoinModal">
          <UserPlus :size="18" />
          Вступить по коду
        </button>
      </template>
    </AppPageHeader>

    <section class="catalog-page__filters">
      <div class="catalog-page__search">
        <span
          id="search"
          class="material-symbols-outlined catalog-page__search-icon"
          aria-hidden="true"
          data-icon-id="search"
        >
          search
        </span>
        <input
          v-model="search"
          class="catalog-page__search-input"
          type="search"
          aria-label="Поиск по названию"
          placeholder="Поиск по названию..."
        >
      </div>
    </section>

    <section class="catalog-page__list">
      <GroupCatalogCard
        v-for="group in filteredGroups"
        :key="group.id"
        :group="group"
      />
      <EmptyState
        v-if="!isLoading && !error && filteredGroups.length === 0"
        title="Группы не найдены"
        description="Пока API не вернул группы по выбранному запросу."
      />
      <EmptyState v-if="error" title="Не удалось загрузить каталог" :description="error" />
    </section>

    <div
      v-if="isJoinModalOpen"
      class="join-modal"
      role="presentation"
      @click.self="closeJoinModal"
    >
      <section
        class="join-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-modal-title"
      >
        <header class="join-modal__header">
          <div>
            <p>Доступ к группе</p>
            <h2 id="join-modal-title">Вступить по коду</h2>
          </div>
          <button type="button" class="join-modal__close" aria-label="Закрыть" @click="closeJoinModal">
            <X :size="20" />
          </button>
        </header>

        <form class="join-modal__form" @submit.prevent="findGroupByCode">
          <label class="join-modal__field">
            <span>Код группы</span>
            <input
              v-model="code"
              type="search"
              placeholder="Введите код"
              autocomplete="off"
            >
          </label>
          <AppButton type="submit" :disabled="isSearchingByCode || !codeQuery">
            {{ isSearchingByCode ? 'Ищем...' : 'Найти группу' }}
          </AppButton>
        </form>

        <RouterLink
          v-if="foundGroup"
          :to="{ name: 'group-preview', params: { groupId: foundGroup.id } }"
          class="join-modal__result"
          @click="closeJoinModal"
        >
          <h3>{{ foundGroup.name }}</h3>
          <p>{{ foundGroup.description || 'Описание группы пока не заполнено.' }}</p>
        </RouterLink>

        <p v-if="isGroupNotFound" class="join-modal__empty">
          Нет группы с таким ID
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.catalog-page__filters {
  align-items: center;
  border-bottom: 1px solid var(--color-divider);
  border-top: 1px solid var(--color-divider);
  display: flex;
  margin-bottom: 36px;
  padding: 22px 0;
}

.catalog-page__search {
  align-items: center;
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  display: grid;
  gap: 12px;
  grid-template-columns: 24px minmax(0, 1fr);
  min-height: 52px;
  max-width: 540px;
  padding: 0 16px;
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  width: min(100%, 540px);
}

.catalog-page__search:focus-within {
  background: var(--color-surface-low);
  border-color: var(--color-outline);
  box-shadow: 0 0 0 3px rgb(21 25 108 / 7%);
}

.catalog-page__search-icon {
  color: var(--color-text-muted);
  font-size: 24px;
  line-height: 1;
}

.catalog-page__search-input {
  background: transparent;
  border: 0;
  color: var(--color-text);
  font: inherit;
  font-weight: 650;
  min-width: 0;
  outline: none;
  width: 100%;
}

.catalog-page__search-input::placeholder {
  color: var(--color-text-muted);
  font-weight: 600;
}

.catalog-page__search-input::-webkit-search-cancel-button {
  display: none;
}

.catalog-page__join-button {
  align-items: center;
  background: var(--color-action-primary-bg);
  border: 0;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-action-primary);
  color: var(--color-action-primary-text);
  cursor: pointer;
  display: inline-flex;
  font-size: 0.92rem;
  font-weight: 800;
  gap: 10px;
  justify-content: center;
  min-height: 46px;
  padding: 0 20px;
  transition: background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  white-space: nowrap;
}

.catalog-page__join-button:hover {
  box-shadow: var(--shadow-action-primary-hover);
  transform: translateY(-1px);
}

.catalog-page__join-button:focus-visible {
  outline: 3px solid var(--color-focus-border);
  outline-offset: 3px;
}

.catalog-page__list {
  display: grid;
  gap: 26px;
}

.join-modal {
  align-items: center;
  background: rgb(17 24 39 / 52%);
  display: grid;
  inset: 0;
  justify-items: center;
  padding: 24px;
  position: fixed;
  z-index: 30;
}

.join-modal__dialog {
  background: var(--color-surface-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-ambient);
  display: grid;
  gap: 22px;
  max-width: 560px;
  padding: 28px;
  width: min(100%, 560px);
}

.join-modal__header {
  align-items: flex-start;
  display: flex;
  gap: 18px;
  justify-content: space-between;
}

.join-modal__header p,
.join-modal__header h2,
.join-modal__result h3,
.join-modal__result p,
.join-modal__empty {
  margin: 0;
}

.join-modal__header p {
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.join-modal__header h2 {
  color: var(--color-text);
  font-size: 1.55rem;
  line-height: 1.15;
  margin-top: 6px;
}

.join-modal__close {
  align-items: center;
  background: var(--color-surface-low);
  border: 0;
  border-radius: var(--radius-xs);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.join-modal__close:hover,
.join-modal__close:focus-visible {
  color: var(--color-text);
  outline: 2px solid var(--color-focus-border);
  outline-offset: 2px;
}

.join-modal__form {
  align-items: end;
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr) auto;
}

.join-modal__field {
  display: grid;
  gap: 8px;
}

.join-modal__field span {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.join-modal__field input {
  background: var(--color-surface-low);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text);
  font: inherit;
  min-height: 50px;
  outline: none;
  padding: 0 16px;
  width: 100%;
}

.join-modal__field input:focus {
  background: var(--color-surface-highest);
  border-color: var(--color-focus-border);
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}

.join-modal__field input::-webkit-search-cancel-button {
  display: none;
}

.join-modal__result {
  background: var(--color-surface-low);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  display: grid;
  gap: 8px;
  padding: 18px;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.join-modal__result:hover,
.join-modal__result:focus-visible {
  border-color: var(--color-outline);
  box-shadow: var(--shadow-soft);
  outline: none;
  transform: translateY(-1px);
}

.join-modal__result h3 {
  color: var(--color-primary);
  font-size: 1.05rem;
  line-height: 1.25;
}

.join-modal__result p,
.join-modal__empty {
  color: var(--color-text-muted);
  line-height: 1.55;
}

.join-modal__empty {
  background: var(--color-surface-low);
  border-radius: var(--radius-md);
  font-weight: 700;
  padding: 18px;
}

@media (max-width: 760px) {
  .catalog-page__search {
    max-width: none;
    width: 100%;
  }

  .catalog-page__join-button {
    width: 100%;
  }

  .join-modal {
    align-items: end;
    padding: 16px;
  }

  .join-modal__dialog {
    padding: 22px;
  }

  .join-modal__form {
    grid-template-columns: 1fr;
  }
}
</style>
