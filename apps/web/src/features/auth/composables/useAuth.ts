import { storeToRefs } from 'pinia'

import { useAuthStore } from '../stores/auth.store'

export function useAuth() {
  const authStore = useAuthStore()

  return {
    ...storeToRefs(authStore),
    initialize: authStore.initialize,
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    clearSessionState: authStore.clearSessionState,
  }
}
