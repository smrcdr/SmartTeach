import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useNotificationStore } from '../stores/notifications.store'
import AppToastViewport from './AppToastViewport.vue'

describe('AppToastViewport', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders notifications in stack order with the newest item last', () => {
    const notifications = useNotificationStore()
    notifications.error('Неверно введены данные')
    notifications.success('Вход выполнен')

    const wrapper = mount(AppToastViewport, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.toast-viewport').exists()).toBe(true)
    expect(wrapper.findAll('.toast-card').map((toast) => toast.text())).toEqual([
      expect.stringContaining('Неверно введены данные'),
      expect.stringContaining('Вход выполнен')
    ])
  })
})
