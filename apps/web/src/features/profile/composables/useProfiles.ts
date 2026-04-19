import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { getPublicProfile } from '../api/profile.api'

export const profileQueryKeys = {
  publicDetail: (userId: string) => ['profiles', 'public', userId] as const,
}

export function usePublicProfile(
  userId: MaybeRefOrGetter<string>,
  options: {
    enabled?: MaybeRefOrGetter<boolean>
  } = {},
) {
  const resolvedUserId = computed(() => toValue(userId))
  const enabled = computed(() => Boolean(resolvedUserId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => profileQueryKeys.publicDetail(resolvedUserId.value)),
    queryFn: () => getPublicProfile(resolvedUserId.value),
    enabled,
  })
}
