<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createJoinRequest,
  getGroup,
  getGroupByCode,
  joinGroup,
  type Group
} from '@/features/groups/api/groups.api'
import GroupHeroPanel from '@/features/groups/components/GroupHeroPanel.vue'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const route = useRoute()
const router = useRouter()
const code = ref('')
const group = ref<Group | null>(null)
const isLoading = ref(false)
const isJoining = ref(false)

async function requireSession() {
  if (auth.accessToken) {
    return true
  }

  await router.push({
    name: 'login',
    query: {
      redirect: route.fullPath
    }
  })
  return false
}

async function submit() {
  if (!code.value.trim() || !(await requireSession())) {
    return
  }

  isLoading.value = true
  try {
    group.value = await getGroupByCode(code.value, auth.accessToken)
  } catch (caught) {
    group.value = null
    notifications.error(caught instanceof Error ? caught.message : 'Группа с таким кодом не найдена')
  } finally {
    isLoading.value = false
  }
}

async function submitAccessRequest() {
  if (!group.value || !(await requireSession())) {
    return
  }

  isJoining.value = true
  try {
    if (group.value.accessMode === 'OPEN') {
      await joinGroup(group.value.id, auth.accessToken)
      notifications.success('Вы вступили в группу')
    } else {
      await createJoinRequest(group.value.id, auth.accessToken)
      notifications.success('Заявка отправлена')
    }

    group.value = await getGroup(group.value.id, auth.accessToken)
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось вступить в группу')
  } finally {
    isJoining.value = false
  }
}
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader
      eyebrow="Доступ"
      title="Вступить по коду"
      description="Введите код группы, который выдал преподаватель или администратор."
    />
    <form class="join-form surface-panel" @submit.prevent="submit">
      <AppTextField v-model="code" label="Код группы" placeholder="Введите код" />
      <AppButton type="submit" :disabled="isLoading || !code.trim()">
        {{ isLoading ? 'Ищем...' : 'Найти группу' }}
      </AppButton>
    </form>
    <section v-if="group" class="join-result">
      <GroupHeroPanel :group="group" :is-joining="isJoining" @join="submitAccessRequest" />
    </section>
  </main>
</template>

<style scoped>
.join-form {
  display: grid;
  gap: 18px;
  max-width: 560px;
  padding: 28px;
}

.join-result {
  margin-top: 30px;
}

.join-result :deep(.group-hero) {
  grid-template-columns: 1fr;
}

.join-result :deep(.group-hero__visual) {
  display: none;
}
</style>
