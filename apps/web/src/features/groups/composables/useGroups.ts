import { computed, onMounted, ref } from 'vue'
import { myGroups, recommendedGroups } from '@/app/demo/demo-data'
import type { DemoGroup } from '@/app/demo/types'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { listGroups } from '../api/groups.api'

export function useGroups(options: { mine?: boolean } = {}) {
  const auth = useAuthStore()
  const groups = ref<DemoGroup[]>(options.mine ? myGroups : recommendedGroups)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const hasFallbackData = computed(() => groups.value === recommendedGroups || groups.value === myGroups)

  async function refresh(search?: string) {
    if (!auth.accessToken && options.mine) {
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
    hasFallbackData,
    refresh
  }
}
