import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGroups } from './useGroups'

const TestComponent = defineComponent({
  setup() {
    return useGroups()
  },
  template: '<span>{{ groups.length }}</span>'
})

describe('useGroups', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads public groups without an active session', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 'group-id' }]), { status: 200 })
    )
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [createPinia()]
      }
    })

    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/groups', expect.objectContaining({
      credentials: 'include',
      headers: expect.any(Headers)
    }))
    expect(wrapper.text()).toBe('1')
  })

  it('falls back to public catalog loading when a stored token is invalid', async () => {
    localStorage.setItem('smarteach.accessToken', 'stale-token')
    localStorage.setItem('smarteach.sessionId', 'stale-session')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      if (input === '/api/v1/auth/me') {
        return Promise.resolve(new Response(JSON.stringify({
          statusCode: 401,
          message: 'Invalid access token'
        }), { status: 401 }))
      }

      return Promise.resolve(new Response(JSON.stringify([{ id: 'public-group' }]), { status: 200 }))
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [createPinia()]
      }
    })

    await flushPromises()
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/auth/me', expect.objectContaining({
      headers: expect.any(Headers)
    }))
    expect((fetchMock.mock.calls[0]?.[1]?.headers as Headers).get('Authorization')).toBe('Bearer stale-token')
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/groups', expect.objectContaining({
      headers: expect.any(Headers)
    }))
    expect((fetchMock.mock.calls[1]?.[1]?.headers as Headers).has('Authorization')).toBe(false)
    expect(localStorage.getItem('smarteach.accessToken')).toBeNull()
    expect(wrapper.text()).toBe('1')
  })
})
