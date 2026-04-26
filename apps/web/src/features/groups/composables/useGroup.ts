import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import type { Group } from '../api/groups.api'
import { getGroup } from '../api/groups.api'

export function useGroup() {
  const route = useRoute()
  const auth = useAuthStore()
  const group = ref<Group | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const groupId = computed(() => String(route.params.groupId ?? ''))

  async function refresh() {
    if (!groupId.value || !auth.accessToken) {
      return
    }

    isLoading.value = true
    error.value = null
    try {
      group.value = await getGroup(groupId.value, auth.accessToken)
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить группу'
    } finally {
      isLoading.value = false
    }
  }

  watch(groupId, () => void refresh(), { immediate: true })

  return {
    group,
    groupId,
    isLoading,
    error,
    refresh
  }
}
