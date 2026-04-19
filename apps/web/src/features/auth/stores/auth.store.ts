import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { queryClient } from '../../../app/providers/query'
import {
  applyAccessSession,
  clearAccessSession,
  getAccessToken,
  onAccessSessionChange,
} from '../../../shared/api/client/http'
import type { components } from '../../../shared/api/generated/openapi'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  register as registerRequest,
  type LoginPayload,
  type RegisterPayload,
} from '../api/auth.api'

type User = components['schemas']['User']
type InitializationState = 'idle' | 'pending' | 'ready'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(getAccessToken())
  const currentUser = ref<User | null>(null)
  const initializationState = ref<InitializationState>('idle')

  let initializePromise: Promise<void> | null = null

  const isAuthenticated = computed(() => Boolean(accessToken.value && currentUser.value))
  const isInitializing = computed(() => initializationState.value === 'pending')
  const hasInitialized = computed(() => initializationState.value === 'ready')

  onAccessSessionChange((session) => {
    accessToken.value = session?.accessToken ?? null
  })

  async function initialize() {
    if (hasInitialized.value) {
      return
    }

    if (!initializePromise) {
      initializationState.value = 'pending'
      initializePromise = bootstrapSession().finally(() => {
        initializationState.value = 'ready'
        initializePromise = null
      })
    }

    return initializePromise
  }

  async function bootstrapSession() {
    const session = await refreshSession()

    if (!session) {
      clearSessionState()
      return
    }

    try {
      await syncCurrentUser()
    } catch {
      clearSessionState()
    }
  }

  async function login(payload: LoginPayload) {
    const session = await loginRequest(payload)

    await establishSession(session)
  }

  async function register(payload: RegisterPayload) {
    const session = await registerRequest(payload)

    await establishSession(session)
  }

  async function logout() {
    try {
      await logoutRequest()
    } finally {
      clearSessionState()
      initializationState.value = 'ready'
    }
  }

  function clearSessionState() {
    clearAccessSession()
    currentUser.value = null
    queryClient.clear()
  }

  async function establishSession(session: { accessToken: string; sessionId: string }) {
    applyAccessSession(session)

    try {
      await syncCurrentUser()
      initializationState.value = 'ready'
    } catch (error) {
      clearSessionState()
      initializationState.value = 'ready'
      throw error
    }
  }

  async function syncCurrentUser() {
    currentUser.value = await getCurrentUser()
  }

  return {
    accessToken,
    currentUser,
    initializationState,
    isAuthenticated,
    isInitializing,
    hasInitialized,
    initialize,
    login,
    register,
    logout,
    clearSessionState,
  }
})
