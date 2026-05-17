import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'

export function useGroupRouteList<T>(
  loader: (groupId: string, token: string) => Promise<T[]>,
  options: {
    enabled?: () => boolean
  } = {}
) {
  const route = useRoute()
  const auth = useAuthStore()
  const items = ref<T[]>([]) as Ref<T[]>
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const groupId = computed(() => String(route.params.groupId ?? ''))

  async function refresh() {
    if (!(options.enabled?.() ?? true)) {
      items.value = []
      return
    }

    if (!groupId.value || !auth.accessToken) {
      return
    }

    isLoading.value = true
    error.value = null
    try {
      items.value = await loader(groupId.value, auth.accessToken)
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить данные'
    } finally {
      isLoading.value = false
    }
  }

  watch(
    [groupId, () => options.enabled?.() ?? true, () => auth.accessToken],
    () => void refresh(),
    { immediate: true }
  )

  return {
    items,
    groupId,
    isLoading,
    error,
    refresh
  }
}

export function useGroupRouteItem<T>(
  routeParamName: string,
  loader: (groupId: string, itemId: string, token: string) => Promise<T>
) {
  const route = useRoute()
  const auth = useAuthStore()
  const item = ref<T | null>(null) as Ref<T | null>
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const groupId = computed(() => String(route.params.groupId ?? ''))
  const itemId = computed(() => String(route.params[routeParamName] ?? ''))

  async function refresh() {
    if (!groupId.value || !itemId.value || !auth.accessToken) {
      return
    }

    isLoading.value = true
    error.value = null
    try {
      item.value = await loader(groupId.value, itemId.value, auth.accessToken)
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить данные'
    } finally {
      isLoading.value = false
    }
  }

  watch([groupId, itemId, () => auth.accessToken], () => void refresh(), { immediate: true })

  return {
    item,
    groupId,
    itemId,
    isLoading,
    error,
    refresh
  }
}
