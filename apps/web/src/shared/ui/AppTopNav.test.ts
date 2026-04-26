import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import AppTopNav from './AppTopNav.vue'

describe('AppTopNav', () => {
  it('pins brand and sections to the left, and omits search', () => {
    const wrapper = mount(AppTopNav, {
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.find('.top-nav__inner--full').exists()).toBe(true)
    expect(wrapper.find('.top-nav__primary').text()).toContain('SmarTeach')
    expect(wrapper.find('.top-nav__primary').text()).toContain('Главная')
    expect(wrapper.find('.top-nav__primary').text()).toContain('Каталог')
    expect(wrapper.find('.top-nav__primary').text()).toContain('Мои группы')
    expect(wrapper.find('.top-nav__primary').text()).toContain('Чаты')
    expect(wrapper.find('.top-nav__auth-actions').text()).toContain('Войти')
    expect(wrapper.find('.top-nav__auth-actions').text()).toContain('Регистрация')
    expect(wrapper.find('[aria-label="Поиск"]').exists()).toBe(false)
  })

  it('keeps the authenticated profile on the right', () => {
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

    const wrapper = mount(AppTopNav, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.top-nav__profile').exists()).toBe(true)
    expect(wrapper.find('.top-nav__profile').text()).toContain('Student Example')
    expect(wrapper.find('.top-nav__profile').text()).toContain('Выйти')
  })
})
