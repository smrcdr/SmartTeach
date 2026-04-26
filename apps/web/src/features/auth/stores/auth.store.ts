import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { currentUser } from '@/app/demo/demo-data'
import * as authApi from '../api/auth.api'

const tokenStorageKey = 'smarteach.accessToken'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem(tokenStorageKey))
  const user = ref<authApi.AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const displayUser = computed(() => user.value ?? {
    id: currentUser.id,
    email: 'alex@example.com',
    name: currentUser.name,
    bio: currentUser.bio,
    avatarUrl: currentUser.avatarUrl
  })

  const isAuthenticated = computed(() => Boolean(accessToken.value))

  function setSession(session: authApi.AuthSession) {
    accessToken.value = session.accessToken
    user.value = session.user
    localStorage.setItem(tokenStorageKey, session.accessToken)
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
      accessToken.value = null
      localStorage.removeItem(tokenStorageKey)
    }
  }

  async function logout() {
    try {
      await authApi.logout(accessToken.value)
    } finally {
      accessToken.value = null
      user.value = null
      localStorage.removeItem(tokenStorageKey)
    }
  }

  return {
    accessToken,
    user,
    displayUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    loadMe,
    logout
  }
})
