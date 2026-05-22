<script setup lang="ts">
import { Link, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createUsefulLink,
  deleteUsefulLink,
  listUsefulLinks,
  updateUsefulLink,
  type CreateUsefulLinkPayload,
  type UsefulLink
} from '@/features/groups/api/groups.api'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { uploadFile } from '@/shared/api/files.api'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import ContentList from './ContentList.vue'
import GroupUsefulLinkDialog, { type UsefulLinkDraft } from './GroupUsefulLinkDialog.vue'

const props = defineProps<{
  enabled: boolean
  canManage: boolean
}>()

const auth = useAuthStore()
const notifications = useNotificationStore()
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingLink = ref<UsefulLink | null>(null)
const deletingLinkId = ref<string | null>(null)
const linkMenu = reactive({
  isOpen: false,
  link: null as UsefulLink | null,
  x: 0,
  y: 0
})
const { items: usefulLinks, groupId, refresh } = useGroupRouteList(listUsefulLinks, {
  enabled: () => props.enabled
})

function openDialog() {
  editingLink.value = null
  isDialogOpen.value = true
}

function openEditDialog(link: UsefulLink) {
  closeLinkMenu()
  editingLink.value = link
  isDialogOpen.value = true
}

function closeDialog() {
  if (isSubmitting.value) {
    return
  }

  isDialogOpen.value = false
  editingLink.value = null
}

function openLinkMenu(event: MouseEvent, link: UsefulLink) {
  if (!props.canManage) {
    return
  }

  event.preventDefault()
  linkMenu.link = link
  linkMenu.x = Math.min(event.clientX, window.innerWidth - 190)
  linkMenu.y = Math.min(event.clientY, window.innerHeight - 104)
  linkMenu.isOpen = true
}

function closeLinkMenu() {
  linkMenu.isOpen = false
  linkMenu.link = null
}

function closeLinkMenuOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeLinkMenu()
  }
}

async function submitUsefulLink(draft: UsefulLinkDraft) {
  if (!groupId.value || !auth.accessToken || isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    if (editingLink.value) {
      await updateUsefulLink(
        groupId.value,
        editingLink.value.id,
        {
          title: draft.title,
          url: draft.url
        },
        auth.accessToken
      )
    } else {
      const image = draft.imageFile
        ? await uploadFile(draft.imageFile, 'group-useful-links', auth.accessToken)
        : null
      const payload: CreateUsefulLinkPayload = {
        title: draft.title,
        url: draft.url,
        imageFileId: image?.id ?? null
      }

      await createUsefulLink(groupId.value, payload, auth.accessToken)
    }

    await refresh()
    notifications.success(editingLink.value ? 'Полезная ссылка обновлена' : 'Полезная ссылка добавлена')
    isDialogOpen.value = false
    editingLink.value = null
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось сохранить ссылку')
  } finally {
    isSubmitting.value = false
  }
}

async function removeUsefulLink(link: UsefulLink) {
  closeLinkMenu()

  if (!groupId.value || !auth.accessToken || deletingLinkId.value || !window.confirm(`Удалить ссылку "${link.title}"?`)) {
    return
  }

  deletingLinkId.value = link.id

  try {
    await deleteUsefulLink(groupId.value, link.id, auth.accessToken)
    await refresh()
    notifications.success('Полезная ссылка удалена')
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось удалить ссылку')
  } finally {
    deletingLinkId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', closeLinkMenu)
  document.addEventListener('keydown', closeLinkMenuOnEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeLinkMenu)
  document.removeEventListener('keydown', closeLinkMenuOnEscape)
})
</script>

<template>
  <ContentList title="Полезные ссылки">
    <template #actions>
      <AppButton v-if="canManage" variant="secondary" size="sm" @click="openDialog">
        <Plus :size="16" />
        Добавить ссылку
      </AppButton>
    </template>

    <div v-if="usefulLinks.length > 0" class="useful-links">
      <article
        v-for="link in usefulLinks"
        :key="link.id"
        class="useful-link"
        @contextmenu="openLinkMenu($event, link)"
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

  <div
    v-if="linkMenu.isOpen && linkMenu.link"
    class="link-menu"
    :style="{ left: `${linkMenu.x}px`, top: `${linkMenu.y}px` }"
    @click.stop
  >
    <button type="button" @click="openEditDialog(linkMenu.link)">
      <Pencil :size="16" />
      Редактировать
    </button>
    <button type="button" class="link-menu__danger" :disabled="deletingLinkId === linkMenu.link.id" @click="removeUsefulLink(linkMenu.link)">
      <Trash2 :size="16" />
      Удалить
    </button>
  </div>

  <GroupUsefulLinkDialog
    :open="isDialogOpen"
    :is-submitting="isSubmitting"
    :mode="editingLink ? 'edit' : 'create'"
    :initial-title="editingLink?.title ?? ''"
    :initial-url="editingLink?.url ?? ''"
    @close="closeDialog"
    @submit="submitUsefulLink"
  />
</template>

<style scoped>
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

.link-menu {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-menu);
  display: grid;
  min-width: 180px;
  padding: 6px;
  position: fixed;
  z-index: 80;
}

.link-menu button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  gap: 10px;
  padding: 10px 12px;
  text-align: left;
}

.link-menu button:hover:not(:disabled) {
  background: var(--color-surface-low);
}

.link-menu button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.link-menu__danger {
  color: var(--color-danger, #b42318) !important;
}
</style>
