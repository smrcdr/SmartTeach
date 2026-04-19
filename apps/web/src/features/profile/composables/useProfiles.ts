import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { useAuthStore } from '../../auth/stores/auth.store'
import { getPublicProfile, updateMyProfile, type UpdateMyProfilePayload } from '../api/profile.api'
import { toPublicProfile } from '../../../shared/lib/user-profile'

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

export function useUpdateMyProfileMutation() {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: (payload: UpdateMyProfilePayload) => updateMyProfile(payload),
    onSuccess: async (profile) => {
      authStore.setCurrentUser(profile)
      queryClient.setQueryData(profileQueryKeys.publicDetail(profile.id), toPublicProfile(profile))
      await queryClient.invalidateQueries()
    },
  })
}
