import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import type { Group } from '../api/groups.api'
import { listGroups } from '../api/groups.api'

export function useGroups(options: { mine?: boolean } = {}) {
  const auth = useAuthStore()
  const groups = ref<Group[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function refresh(search?: string) {
    if (!auth.accessToken) {
      return
    }

    isLoading.value = true
    error.value = null
    try {
      groups.value = await listGroups({ search, mine: options.mine }, auth.accessToken)
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить группы'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    void refresh()
  })

  return {
    groups,
    isLoading,
    error,
    refresh
  }
}
