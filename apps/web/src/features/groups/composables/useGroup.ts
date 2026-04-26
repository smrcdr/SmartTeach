import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { ApiError } from '@/shared/api/http'
import type { Group } from '../api/groups.api'
import { getGroup } from '../api/groups.api'

export function useGroup() {
  const route = useRoute()
  const auth = useAuthStore()
  const group = ref<Group | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const groupId = computed(() => String(route.params.groupId ?? ''))

  async function resolveRequestToken() {
    if (!auth.accessToken) {
      return null
    }

    return (await auth.ensureSession()) ? auth.accessToken : null
  }

  async function refresh() {
    if (!groupId.value) {
      return
    }

    isLoading.value = true
    error.value = null
    try {
      group.value = await getGroup(groupId.value, await resolveRequestToken())
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        auth.clearSession()
        group.value = await getGroup(groupId.value, null)
        return
      }

      error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить группу'
    } finally {
      isLoading.value = false
    }
  }

  watch([groupId, () => auth.accessToken], () => void refresh(), { immediate: true })

  return {
    group,
    groupId,
    isLoading,
    error,
    refresh
  }
}
