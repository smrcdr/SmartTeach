import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import RegisterPage from './RegisterPage.vue'

const fetchMock = vi.fn()

async function mountPage() {
  const pinia = createPinia()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', component: RegisterPage },
      { path: '/login', component: { template: '<span />' } },
      { path: '/my-groups', component: { template: '<span />' } }
    ]
  })

  router.push('/register')
  await router.isReady()

  const wrapper = mount(RegisterPage, {
    global: {
      plugins: [pinia, router]
    }
  })

  return {
    pinia,
    wrapper
  }
}

describe('RegisterPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    localStorage.clear()
  })

  it('shows only the centered registration form without promo copy', async () => {
    const { wrapper } = await mountPage()

    expect(wrapper.find('.auth-shell__story').exists()).toBe(false)
    expect(wrapper.find('.auth-card__header p').exists()).toBe(false)
    expect(wrapper.find('.auth-card').classes()).toContain('auth-card--wide-fields')
    expect(wrapper.find('.auth-page').classes()).toContain('auth-page--centered')
    expect(wrapper.find('.auth-shell').classes()).toContain('auth-shell--wide')
    expect(wrapper.text()).toContain('Регистрация')
    expect(wrapper.find('.auth-card__link-action').text()).toBe('Войти')
    expect(wrapper.text()).not.toContain('Создать профиль')
    expect(wrapper.text()).not.toContain('Новый профиль')
    expect(wrapper.text()).not.toContain('Имя будет видно')
    expect(wrapper.text()).not.toContain('Создайте аккаунт, чтобы присоединяться')
    expect(wrapper.text()).not.toContain('Курсы и классы')
    expect(wrapper.text()).not.toContain('Чаты')
    expect(wrapper.text()).not.toContain('Защищённый доступ')
  })

  it('sets the auth shell width so input fields stay compact', () => {
    const source = readFileSync(`${process.cwd()}/src/pages/auth/RegisterPage.vue`, 'utf8')

    expect(source).toContain('width: min(100%, 480px);')
  })

  it('shows success and backend error notifications around registration', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock
      .mockResolvedValueOnce({
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
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        text: () => Promise.resolve(JSON.stringify({
          statusCode: 409,
          message: 'User with this email already exists'
        }))
      })

    const { pinia, wrapper: firstWrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)
    const firstInputs = firstWrapper.findAll('input')

    await firstInputs[0].setValue('Student Example')
    await firstInputs[1].setValue('student@smarteach.local')
    await firstInputs[2].setValue('Password123!')

    await firstWrapper.find('form').trigger('submit')
    await flushPromises()

    expect(notifications.items.at(-1)).toMatchObject({
      type: 'success',
      message: 'Регистрация выполнена'
    })

    const { pinia: secondPinia, wrapper: secondWrapper } = await mountPage()
    const secondNotifications = useNotificationStore(secondPinia)
    const secondInputs = secondWrapper.findAll('input')

    await secondInputs[0].setValue('Student Example')
    await secondInputs[1].setValue('student@smarteach.local')
    await secondInputs[2].setValue('Password123!')

    await secondWrapper.find('form').trigger('submit')
    await flushPromises()

    expect(secondNotifications.items.at(-1)).toMatchObject({
      type: 'error',
      message: 'Пользователь с таким email уже существует'
    })
  })

  it('shows a concrete email error on every invalid registration submit', async () => {
    vi.stubGlobal('fetch', fetchMock)
    const { pinia, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('Student Example')
    await inputs[1].setValue('wrong-email')
    await inputs[2].setValue('Password123!')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('form').attributes()).toHaveProperty('novalidate')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(notifications.items.at(-1)).toMatchObject({
      type: 'error',
      message: 'Введите корректный email'
    })
  })

  it('shows a concrete password error on every invalid registration submit', async () => {
    vi.stubGlobal('fetch', fetchMock)
    const { pinia, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('Student Example')
    await inputs[1].setValue('student@smarteach.local')
    await inputs[2].setValue('short')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(notifications.items.at(-1)).toMatchObject({
      type: 'error',
      message: 'Пароль должен быть не короче 8 символов'
    })
  })

  it('shows a concrete display name error on every invalid registration submit', async () => {
    vi.stubGlobal('fetch', fetchMock)
    const { pinia, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('A')
    await inputs[1].setValue('student@smarteach.local')
    await inputs[2].setValue('Password123!')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(notifications.items.at(-1)).toMatchObject({
      type: 'error',
      message: 'Имя должно быть не короче 2 символов'
    })
  })
})
