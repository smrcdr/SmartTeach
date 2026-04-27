<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { BookOpen, CalendarDays, ClipboardList, Link, MessageCircle, Plus, Upload, X } from 'lucide-vue-next'
import {
  createUsefulLink,
  listAssignments,
  listLessons,
  listScheduleEvents,
  listUsefulLinks,
  type CreateUsefulLinkPayload
} from '@/features/groups/api/groups.api'
import { listGroupChats } from '@/features/chats/api/chats.api'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { uploadFile } from '@/shared/api/files.api'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import ContentList from '@/features/groups/components/ContentList.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import MetricTile from '@/shared/ui/MetricTile.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const { group, error } = useGroup()
const usefulLinksEnabled = computed(() => Boolean(group.value?.settings.usefulLinksEnabled))
const canManage = computed(() => canManageGroup(group.value))
const hasMetrics = computed(() => {
  const settings = group.value?.settings

  return Boolean(
    settings?.lessonsEnabled ||
    settings?.assignmentsEnabled ||
    settings?.scheduleEnabled ||
    settings?.chatEnabled
  )
})
const isLinkDialogOpen = ref(false)
const isSubmittingLink = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)
const linkForm = reactive({
  title: '',
  url: '',
  imageFile: null as File | null
})
const { items: lessons } = useGroupRouteList(listLessons, {
  enabled: () => Boolean(group.value?.settings.lessonsEnabled)
})
const { items: assignments } = useGroupRouteList(listAssignments, {
  enabled: () => Boolean(group.value?.settings.assignmentsEnabled)
})
const { items: schedule } = useGroupRouteList(listScheduleEvents, {
  enabled: () => Boolean(group.value?.settings.scheduleEnabled)
})
const { items: chats } = useGroupRouteList(listGroupChats, {
  enabled: () => Boolean(group.value?.settings.chatEnabled)
})
const { items: usefulLinks, refresh: refreshUsefulLinks } = useGroupRouteList(listUsefulLinks, {
  enabled: () => usefulLinksEnabled.value
})

function openLinkDialog() {
  resetLinkForm()
  isLinkDialogOpen.value = true
}

function closeLinkDialog() {
  if (isSubmittingLink.value) {
    return
  }

  isLinkDialogOpen.value = false
  resetLinkForm()
}

function resetLinkForm() {
  linkForm.title = ''
  linkForm.url = ''
  linkForm.imageFile = null

  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

function handleImageChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null

  if (file && !file.type.startsWith('image/')) {
    notifications.error('Для полезной ссылки можно прикрепить только изображение')
    const input = event.target as HTMLInputElement

    input.value = ''
    linkForm.imageFile = null
    return
  }

  linkForm.imageFile = file
}

function validateLinkForm() {
  if (linkForm.title.trim().length === 0) {
    notifications.error('Укажите текст ссылки')
    return false
  }

  try {
    const url = new URL(linkForm.url.trim())

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported protocol')
    }
  } catch {
    notifications.error('Укажите корректную ссылку')
    return false
  }

  return true
}

async function submitUsefulLink() {
  if (!group.value || isSubmittingLink.value || !validateLinkForm()) {
    return
  }

  isSubmittingLink.value = true

  try {
    const image = linkForm.imageFile
      ? await uploadFile(linkForm.imageFile, 'group-useful-links', auth.accessToken)
      : null
    const payload: CreateUsefulLinkPayload = {
      title: linkForm.title.trim(),
      url: linkForm.url.trim(),
      imageFileId: image?.id ?? null
    }

    await createUsefulLink(group.value.id, payload, auth.accessToken)
    await refreshUsefulLinks()
    notifications.success('Полезная ссылка добавлена')
    isLinkDialogOpen.value = false
    resetLinkForm()
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось добавить ссылку')
  } finally {
    isSubmittingLink.value = false
  }
}
</script>

<template>
  <main v-if="group" class="page workspace-page">
    <AppPageHeader
      eyebrow="Рабочая область"
      :title="group.name"
      :description="group.description ?? undefined"
      align="split"
    >
      <template #actions>
        <StatusPill label="Active" tone="success" />
      </template>
    </AppPageHeader>

    <section v-if="hasMetrics" class="workspace-page__metrics">
      <MetricTile v-if="group.settings.lessonsEnabled" label="Материалов" :value="lessons.length" detail="Опубликованные и черновики" :icon="BookOpen" />
      <MetricTile v-if="group.settings.assignmentsEnabled" label="Заданий" :value="assignments.length" detail="Активные проверки" :icon="ClipboardList" />
      <MetricTile v-if="group.settings.scheduleEnabled" label="Событий" :value="schedule.length" detail="Ближайшие встречи" :icon="CalendarDays" />
      <MetricTile v-if="group.settings.chatEnabled" label="Чатов" :value="chats.length" detail="Коммуникация группы" :icon="MessageCircle" />
    </section>

    <ContentList v-if="usefulLinksEnabled" title="Полезные ссылки">
      <template #actions>
        <AppButton v-if="canManage" variant="secondary" size="sm" @click="openLinkDialog">
          <Plus :size="16" />
          Добавить ссылку
        </AppButton>
      </template>

      <div v-if="usefulLinks.length > 0" class="useful-links">
        <article
          v-for="link in usefulLinks"
          :key="link.id"
          class="useful-link"
        >
          <img
            v-if="link.image"
            class="useful-link__image"
            :src="link.image.url"
            :alt="link.title"
          >
          <span v-else class="useful-link__placeholder" aria-hidden="true">
            <Link :size="20" />
          </span>
          <a :href="link.url" target="_blank" rel="noreferrer">{{ link.title }}</a>
        </article>
      </div>
      <EmptyState v-else title="Полезных ссылок пока нет" />
    </ContentList>

    <div v-if="isLinkDialogOpen" class="link-dialog" @click.self="closeLinkDialog">
      <form
        class="link-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-dialog-title"
        @submit.prevent="submitUsefulLink"
      >
        <header class="link-dialog__header">
          <div>
            <span class="eyebrow">Полезная ссылка</span>
            <h2 id="link-dialog-title">Добавить ссылку</h2>
          </div>
          <button class="link-dialog__close" type="button" aria-label="Закрыть" @click="closeLinkDialog">
            <X :size="18" />
          </button>
        </header>

        <AppTextField v-model="linkForm.title" name="title" label="Текст" placeholder="Например: Телеграм" />
        <AppTextField v-model="linkForm.url" name="url" label="Ссылка" placeholder="https://t.me/test123" />

        <label class="link-dialog__file">
          <span>
            <Upload :size="18" />
            Картинка
          </span>
          <strong>{{ linkForm.imageFile?.name ?? 'Выберите изображение' }}</strong>
          <input ref="imageInput" type="file" accept="image/*" @change="handleImageChange">
        </label>

        <div class="link-dialog__actions">
          <AppButton type="submit" size="lg" :disabled="isSubmittingLink">
            {{ isSubmittingLink ? 'Добавляем...' : 'Добавить ссылку' }}
          </AppButton>
          <AppButton type="button" variant="quiet" size="lg" :disabled="isSubmittingLink" @click="closeLinkDialog">
            Отмена
          </AppButton>
        </div>
      </form>
    </div>
  </main>
  <main v-else class="page">
    <EmptyState title="Не удалось загрузить группу" :description="error ?? 'Данные группы ожидаются от API.'" />
  </main>
</template>

<style scoped>
.workspace-page__metrics {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  margin-bottom: 28px;
}

.useful-links {
  display: grid;
  gap: 12px;
}

.useful-link {
  align-items: center;
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  display: flex;
  gap: 14px;
  min-height: 68px;
  padding: 14px 16px;
}

.useful-link__image,
.useful-link__placeholder {
  border-radius: var(--radius-sm);
  flex: 0 0 auto;
  height: 42px;
  width: 42px;
}

.useful-link__image {
  object-fit: cover;
}

.useful-link__placeholder {
  align-items: center;
  background: var(--color-surface-high);
  color: var(--color-primary);
  display: inline-flex;
  justify-content: center;
}

.useful-link a {
  color: var(--color-primary);
  font-size: 1rem;
  font-weight: 800;
}

.useful-link a:hover {
  text-decoration: underline;
}

.link-dialog {
  align-items: center;
  background: rgb(0 0 0 / 38%);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 24px;
  position: fixed;
  z-index: 70;
}

.link-dialog__panel {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 18px;
  max-width: 540px;
  padding: clamp(22px, 4vw, 34px);
  width: min(100%, 540px);
}

.link-dialog__header,
.link-dialog__actions {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.link-dialog__header h2 {
  color: var(--color-primary);
  font-size: 1.45rem;
  margin: 6px 0 0;
}

.link-dialog__close {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: 999px;
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.link-dialog__file {
  background: var(--color-surface-low);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: grid;
  gap: 8px;
  padding: 16px;
}

.link-dialog__file span {
  align-items: center;
  color: var(--color-text-muted);
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 8px;
  text-transform: uppercase;
}

.link-dialog__file strong {
  color: var(--color-primary);
  font-size: 0.95rem;
}

.link-dialog__file input {
  display: none;
}

.link-dialog__actions {
  justify-content: flex-start;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .link-dialog__actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
