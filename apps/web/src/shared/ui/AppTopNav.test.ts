import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import AppTopNav from './AppTopNav.vue'

async function mountWithRoute(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: { template: '<RouterView />' },
        children: [
          { path: '', component: { template: '<span />' } },
          { path: 'login', component: { template: '<span />' } },
          { path: 'register', component: { template: '<span />' } }
        ]
      },
      {
        path: '/',
        component: { template: '<RouterView />' },
        children: [
          { path: 'catalog', component: { template: '<span />' } },
          { path: 'my-groups', component: { template: '<span />' } },
          { path: 'chats', component: { template: '<span />' } }
        ]
      }
    ]
  })

  router.push(path)
  await router.isReady()

  return mount(AppTopNav, {
    global: {
      plugins: [createPinia(), router],
      stubs: {
        RouterLink: false
      }
    }
  })
}

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
    expect(wrapper.find('.top-nav__profile-trigger img').exists()).toBe(false)
  })

  it('opens a minimal profile menu with profile and logout actions', async () => {
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
    auth.logout = vi.fn()

    const wrapper = mount(AppTopNav, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.top-nav__profile-menu').exists()).toBe(false)

    await wrapper.find('.top-nav__profile-trigger').trigger('click')

    const actions = wrapper.findAll('.top-nav__profile-menu a, .top-nav__profile-menu button')
    expect(actions.map((action) => action.text())).toEqual(['Открыть профиль', 'Выйти'])
    expect(actions[0].attributes('href')).toBe('/profile')

    await actions[1].trigger('click')

    expect(auth.logout).toHaveBeenCalledOnce()
  })

  it('renders backend avatar only when avatarUrl is present', () => {
    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.accessToken = 'access-token'
    auth.user = {
      id: 'user-id',
      email: 'student@smarteach.local',
      displayName: 'Student Example',
      bio: null,
      avatarUrl: 'https://cdn.example.com/avatar.png'
    }

    const wrapper = mount(AppTopNav, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.top-nav__profile-trigger img').attributes('src')).toBe('https://cdn.example.com/avatar.png')
  })

  it.each(['/login', '/register'])('does not highlight home while %s is open', async (path) => {
    const wrapper = await mountWithRoute(path)

    const homeLink = wrapper.findAll('.top-nav__link').find((link) => link.text() === 'Главная')

    expect(homeLink?.classes()).not.toContain('router-link-active')
    expect(homeLink?.classes()).not.toContain('router-link-exact-active')
  })
})
