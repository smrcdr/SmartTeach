import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import ProfilePage from './ProfilePage.vue'

describe('ProfilePage', () => {
  it('links to the profile edit page', () => {
    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.accessToken = 'access-token'
    auth.user = {
      id: 'user-id',
      email: 'student@smarteach.local',
      displayName: 'Student Example',
      bio: null,
      avatarUrl: null
    }

    const wrapper = mount(ProfilePage, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>'
          },
          GroupCatalogCard: true,
          EmptyState: true
        }
      }
    })

    const editLink = wrapper.find('.profile-card__edit')

    expect(editLink.exists()).toBe(true)
    expect(editLink.attributes('href')).toBe('/profile/edit')
    expect(editLink.text()).toBe('Редактировать профиль')
  })
})
