import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'success' | 'error'

export type NotificationItem = {
  id: string
  type: NotificationType
  message: string
  timeoutMs: number
}

type AddNotificationOptions = {
  timeoutMs?: number
}

const defaultTimeoutMs = 5200
let nextNotificationId = 0

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<NotificationItem[]>([])

  function remove(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function add(type: NotificationType, message: string, options: AddNotificationOptions = {}) {
    const id = `notification-${Date.now()}-${nextNotificationId}`
    const timeoutMs = options.timeoutMs ?? defaultTimeoutMs
    nextNotificationId += 1

    items.value.push({
      id,
      type,
      message,
      timeoutMs
    })

    if (timeoutMs > 0) {
      window.setTimeout(() => remove(id), timeoutMs)
    }

    return id
  }

  function success(message: string, options?: AddNotificationOptions) {
    return add('success', message, options)
  }

  function error(message: string, options?: AddNotificationOptions) {
    return add('error', message, options)
  }

  function clear() {
    items.value = []
  }

  return {
    items,
    success,
    error,
    remove,
    clear
  }
})
