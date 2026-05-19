<script setup lang="ts">
import { Link, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createUsefulLink,
  listUsefulLinks,
  type CreateUsefulLinkPayload
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
const { items: usefulLinks, groupId, refresh } = useGroupRouteList(listUsefulLinks, {
  enabled: () => props.enabled
})

function openDialog() {
  isDialogOpen.value = true
}

function closeDialog() {
  if (isSubmitting.value) {
    return
  }

  isDialogOpen.value = false
}

async function submitUsefulLink(draft: UsefulLinkDraft) {
  if (!groupId.value || !auth.accessToken || isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    const image = draft.imageFile
      ? await uploadFile(draft.imageFile, 'group-useful-links', auth.accessToken)
      : null
    const payload: CreateUsefulLinkPayload = {
      title: draft.title,
      url: draft.url,
      imageFileId: image?.id ?? null
    }

    await createUsefulLink(groupId.value, payload, auth.accessToken)
    await refresh()
    notifications.success('Полезная ссылка добавлена')
    isDialogOpen.value = false
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось добавить ссылку')
  } finally {
    isSubmitting.value = false
  }
}
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

  <GroupUsefulLinkDialog
    :open="isDialogOpen"
    :is-submitting="isSubmitting"
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
</style>
