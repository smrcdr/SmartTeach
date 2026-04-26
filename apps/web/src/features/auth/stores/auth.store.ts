import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '../api/auth.api'

const tokenStorageKey = 'smarteach.accessToken'
const sessionStorageKey = 'smarteach.sessionId'

function getStoredToken() {
  return localStorage.getItem(tokenStorageKey)
}

function getStoredSessionId() {
  return localStorage.getItem(sessionStorageKey)
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(getStoredToken())
  const sessionId = ref<string | null>(getStoredSessionId())
  const user = ref<authApi.AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasCheckedSession = ref(false)

  const displayUser = computed(() => user.value)

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))

  function setSession(session: authApi.AuthSession) {
    accessToken.value = session.accessToken
    sessionId.value = session.sessionId
    user.value = session.user
    localStorage.setItem(tokenStorageKey, session.accessToken)
    localStorage.setItem(sessionStorageKey, session.sessionId)
  }

  function setTokenPair(tokenPair: authApi.TokenPair) {
    accessToken.value = tokenPair.accessToken
    sessionId.value = tokenPair.sessionId
    localStorage.setItem(tokenStorageKey, tokenPair.accessToken)
    localStorage.setItem(sessionStorageKey, tokenPair.sessionId)
  }

  function clearSession() {
    accessToken.value = null
    sessionId.value = null
    user.value = null
    localStorage.removeItem(tokenStorageKey)
    localStorage.removeItem(sessionStorageKey)
  }

  async function login(payload: authApi.LoginPayload) {
    isLoading.value = true
    error.value = null
    try {
      setSession(await authApi.login(payload))
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Не удалось войти'
      throw caught
    } finally {
      isLoading.value = false
    }
  }

  async function register(payload: authApi.RegisterPayload) {
    isLoading.value = true
    error.value = null
    try {
      setSession(await authApi.register(payload))
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Не удалось зарегистрироваться'
      throw caught
    } finally {
      isLoading.value = false
    }
  }

  async function loadMe() {
    if (!accessToken.value) {
      return
    }

    try {
      user.value = await authApi.getMe(accessToken.value)
    } catch {
      clearSession()
    }
  }

  async function ensureSession() {
    if (accessToken.value) {
      if (!user.value) {
        await loadMe()
      }

      hasCheckedSession.value = true
      return Boolean(accessToken.value)
    }

    if (hasCheckedSession.value) {
      return false
    }

    hasCheckedSession.value = true

    try {
      setTokenPair(await authApi.refresh())
      await loadMe()
      return Boolean(accessToken.value)
    } catch {
      clearSession()
      return false
    }
  }

  async function logout() {
    try {
      await authApi.logout(accessToken.value)
    } finally {
      clearSession()
    }
  }

  return {
    accessToken,
    sessionId,
    user,
    displayUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    loadMe,
    ensureSession,
    logout
  }
})
