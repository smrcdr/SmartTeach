import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ApiError, configureAuthRefresh } from '@/shared/api/http'
import * as authApi from '../api/auth.api'
import { translateAuthValidationError } from '../lib/auth-validation'

const tokenStorageKey = 'smarteach.accessToken'
const sessionStorageKey = 'smarteach.sessionId'

function getStoredToken() {
  return localStorage.getItem(tokenStorageKey)
}

function getStoredSessionId() {
  return localStorage.getItem(sessionStorageKey)
}

function getPayloadValidationErrors(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object' || !('errors' in payload)) {
    return []
  }

  const errors = (payload as { errors?: unknown }).errors

  if (!Array.isArray(errors)) {
    return []
  }

  return errors.map(String)
}

function getAuthValidationErrorMessage(payload: unknown) {
  const errors = getPayloadValidationErrors(payload)

  for (const error of errors) {
    const translated = translateAuthValidationError(error)

    if (translated) {
      return translated
    }
  }

  return errors[0] ?? null
}

function getAuthErrorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiError) {
    if (caught.status === 0) {
      return 'Не удалось подключиться к серверу'
    }

    if (caught.status === 401) {
      return 'Неверный email или пароль'
    }

    if (caught.status === 409) {
      return 'Пользователь с таким email уже существует'
    }

    if (caught.status === 400) {
      return getAuthValidationErrorMessage(caught.payload) ?? 'Проверьте правильность заполнения полей'
    }

    if (caught.status >= 500) {
      return 'Сервер временно недоступен. Попробуйте позже'
    }
  }

  if (caught instanceof Error && caught.message) {
    return caught.message
  }

  return fallback
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(getStoredToken())
  const sessionId = ref<string | null>(getStoredSessionId())
  const user = ref<authApi.AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasCheckedSession = ref(false)
  let refreshPromise: Promise<string | null> | null = null

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

  async function refreshAccessToken() {
    if (!refreshPromise) {
      refreshPromise = authApi.refresh()
        .then((tokenPair) => {
          setTokenPair(tokenPair)
          return tokenPair.accessToken
        })
        .catch(() => {
          clearSession()
          return null
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    return refreshPromise
  }

  configureAuthRefresh(refreshAccessToken, clearSession)

  async function login(payload: authApi.LoginPayload) {
    isLoading.value = true
    error.value = null
    try {
      setSession(await authApi.login(payload))
    } catch (caught) {
      error.value = getAuthErrorMessage(caught, 'Не удалось войти')
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
      error.value = getAuthErrorMessage(caught, 'Не удалось зарегистрироваться')
      throw caught
    } finally {
      isLoading.value = false
    }
  }

  async function loadMe() {
    if (!accessToken.value) {
      return false
    }

    try {
      user.value = await authApi.getMe(accessToken.value)
      return true
    } catch {
      clearSession()
      return false
    }
  }

  async function ensureSession() {
    if (accessToken.value) {
      if (!user.value) {
        const loaded = await loadMe()
        hasCheckedSession.value = true
        return loaded
      }

      hasCheckedSession.value = true
      return Boolean(accessToken.value)
    }

    if (hasCheckedSession.value) {
      return false
    }

    hasCheckedSession.value = true

    try {
      await refreshAccessToken()
      const loaded = await loadMe()
      return loaded
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
    clearSession,
    logout
  }
})
