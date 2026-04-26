import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import LoginPage from './LoginPage.vue'

const fetchMock = vi.fn()

async function mountPage() {
  const pinia = createPinia()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginPage },
      { path: '/register', component: { template: '<span />' } },
      { path: '/my-groups', component: { template: '<span />' } }
    ]
  })

  router.push('/login')
  await router.isReady()

  const wrapper = mount(LoginPage, {
    global: {
      plugins: [pinia, router]
    }
  })

  return {
    pinia,
    wrapper
  }
}

describe('LoginPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    localStorage.clear()
  })

  it('shows only the centered login form without promo copy', async () => {
    const { wrapper } = await mountPage()

    expect(wrapper.find('.auth-shell__story').exists()).toBe(false)
    expect(wrapper.find('.auth-card__header p').exists()).toBe(false)
    expect(wrapper.find('.auth-card').classes()).toContain('auth-card--wide-fields')
    expect(wrapper.find('.auth-page').classes()).toContain('auth-page--centered')
    expect(wrapper.find('.auth-shell').classes()).toContain('auth-shell--wide')
    expect(wrapper.text()).toContain('Войти')
    expect(wrapper.find('.auth-card__link-action').text()).toBe('Зарегистрироваться')
    expect(wrapper.text()).not.toContain('Закрытая рабочая область')
    expect(wrapper.text()).not.toContain('Используйте email')
    expect(wrapper.text()).not.toContain('Учебные материалы')
    expect(wrapper.text()).not.toContain('Групповые чаты')
    expect(wrapper.text()).not.toContain('Защищённая сессия')
  })

  it('sets the auth shell width so input fields stay compact', () => {
    const source = readFileSync(`${process.cwd()}/src/pages/auth/LoginPage.vue`, 'utf8')

    expect(source).toContain('width: min(100%, 480px);')
  })

  it('shows an error notification when login fails', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve(JSON.stringify({
        statusCode: 401,
        message: 'Invalid email or password'
      }))
    })

    const { pinia, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('student@smarteach.local')
    await inputs[1].setValue('Password123!')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(notifications.items.at(-1)).toMatchObject({
      type: 'error',
      message: 'Неверный email или пароль'
    })
  })

  it('shows a success notification when login succeeds', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        accessToken: 'token',
        sessionId: 'session',
        user: {
          id: 'user-id',
          email: 'student@smarteach.local',
          displayName: 'Student Example',
          bio: null,
          avatarUrl: null
        }
      }))
    })

    const { pinia, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('student@smarteach.local')
    await inputs[1].setValue('Password123!')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(notifications.items.at(-1)).toMatchObject({
      type: 'success',
      message: 'Вход выполнен'
    })
  })

  it('shows a concrete email error on every invalid login submit', async () => {
    vi.stubGlobal('fetch', fetchMock)
    const { pinia, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('wrong-email')
    await inputs[1].setValue('Password123!')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('form').attributes()).toHaveProperty('novalidate')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(notifications.items.at(-1)).toMatchObject({
      type: 'error',
      message: 'Введите корректный email'
    })
  })

  it('shows a concrete password error on every invalid login submit', async () => {
    vi.stubGlobal('fetch', fetchMock)
    const { pinia, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('student@smarteach.local')
    await inputs[1].setValue('short')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(notifications.items.at(-1)).toMatchObject({
      type: 'error',
      message: 'Пароль должен быть не короче 8 символов'
    })
  })
})
