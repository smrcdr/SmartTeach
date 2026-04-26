import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import ProfileEditPage from './ProfileEditPage.vue'

const fetchMock = vi.fn()

async function mountPage() {
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  auth.accessToken = 'access-token'
  auth.user = {
    id: 'user-id',
    email: 'student@smarteach.local',
    displayName: 'Student Example',
    bio: 'Старое описание',
    avatarUrl: null
  }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/profile/edit', component: ProfileEditPage },
      { path: '/profile', component: { template: '<span />' } }
    ]
  })

  router.push('/profile/edit')
  await router.isReady()

  const wrapper = mount(ProfileEditPage, {
    global: {
      plugins: [pinia, router]
    }
  })

  return {
    auth,
    pinia,
    wrapper
  }
}

describe('ProfileEditPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    localStorage.clear()
  })

  it('saves profile changes and updates the current user in the auth store', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        id: 'user-id',
        email: 'student@smarteach.local',
        displayName: 'Updated Student',
        bio: 'Новое описание',
        avatarFileId: null,
        avatarUrl: null
      }))
    })

    const { auth, pinia, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)

    await wrapper.find('input[name="displayName"]').setValue('Updated Student')
    await wrapper.find('textarea[name="bio"]').setValue('Новое описание')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/users/me', expect.objectContaining({
      method: 'PATCH'
    }))
    expect(auth.user?.displayName).toBe('Updated Student')
    expect(auth.user?.bio).toBe('Новое описание')
    expect(notifications.items.at(-1)).toMatchObject({
      type: 'success',
      message: 'Профиль обновлён'
    })
  })
})
