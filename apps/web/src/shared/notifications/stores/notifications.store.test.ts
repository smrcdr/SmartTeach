import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotificationStore } from './notifications.store'

describe('notification store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps newer notifications after older ones so the newest renders at the bottom', () => {
    const notifications = useNotificationStore()

    notifications.error('Первая ошибка')
    notifications.success('Операция выполнена')

    expect(notifications.items.map((item) => item.message)).toEqual([
      'Первая ошибка',
      'Операция выполнена'
    ])
  })

  it('removes notifications manually and after timeout', () => {
    const notifications = useNotificationStore()

    const firstId = notifications.error('Ошибка')
    const secondId = notifications.success('Готово', { timeoutMs: 1000 })

    notifications.remove(firstId)
    expect(notifications.items.map((item) => item.id)).toEqual([secondId])

    vi.advanceTimersByTime(1000)
    expect(notifications.items).toEqual([])
  })
})
