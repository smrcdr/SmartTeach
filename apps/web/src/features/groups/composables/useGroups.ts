import { onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { ApiError } from '@/shared/api/http'
import type { Group } from '../api/groups.api'
import { listGroups } from '../api/groups.api'

export function useGroups(options: { mine?: boolean } = {}) {
  const auth = useAuthStore()
  const groups = ref<Group[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function resolveRequestToken() {
    if (!auth.accessToken) {
      return null
    }

    return (await auth.ensureSession()) ? auth.accessToken : null
  }

  async function refresh(search?: string) {
    const token = await resolveRequestToken()

    if (options.mine && !token) {
      groups.value = []
      return
    }

    isLoading.value = true
    error.value = null
    try {
      groups.value = await listGroups({ search, mine: options.mine }, token)
    } catch (caught) {
      if (!options.mine && caught instanceof ApiError && caught.status === 401) {
        auth.clearSession()
        groups.value = await listGroups({ search }, null)
        return
      }

      error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить группы'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    void refresh()
  })

  watch(() => auth.accessToken, () => {
    void refresh()
  })

  return {
    groups,
    isLoading,
    error,
    refresh
  }
}
