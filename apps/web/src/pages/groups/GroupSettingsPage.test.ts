import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import type { Group } from '@/features/groups/api/groups.api'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import GroupSettingsPage from './GroupSettingsPage.vue'

const fetchMock = vi.fn()

function buildGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'group-id',
    code: 'WEB101',
    name: 'Web Basics',
    description: 'Первичное описание',
    ownerId: 'owner-id',
    owner: {
      id: 'owner-id',
      displayName: 'Owner',
      bio: null,
      avatarUrl: null
    },
    accessMode: 'BY_REQUEST',
    status: 'ACTIVE',
    settings: {
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: true,
      scheduleEnabled: true,
      scheduleWeeklyEnabled: true,
      scheduleSpecialEnabled: true,
      usefulLinksEnabled: true
    },
    membersCount: 2,
    viewerMembershipRole: 'ADMIN',
    viewerJoinRequestStatus: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    ...overrides
  }
}

async function mountPage() {
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  auth.accessToken = 'access-token'
  auth.user = {
    id: 'admin-id',
    email: 'admin@smarteach.local',
    displayName: 'Admin Example',
    bio: null,
    avatarUrl: null
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/groups/:groupId/workspace/settings', name: 'group-settings', component: GroupSettingsPage }
    ]
  })

  router.push('/groups/group-id/workspace/settings')
  await router.isReady()

  const wrapper = mount(GroupSettingsPage, {
    global: {
      plugins: [pinia, router]
    }
  })

  await flushPromises()

  return {
    pinia,
    wrapper
  }
}

describe('GroupSettingsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    localStorage.clear()
  })

  it('loads group settings and saves all editable fields through backend endpoints', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/v1/groups/group-id/settings') {
        return Promise.resolve(new Response(JSON.stringify({
          chatEnabled: false,
          lessonsEnabled: true,
          assignmentsEnabled: true,
          scheduleEnabled: true,
          scheduleWeeklyEnabled: true,
          scheduleSpecialEnabled: true,
          usefulLinksEnabled: true
        }), { status: 200 }))
      }

      if (url === '/api/v1/groups/group-id' && init?.method === 'PATCH') {
        return Promise.resolve(new Response(JSON.stringify(buildGroup({
          name: 'Updated group',
          description: '',
          accessMode: 'CLOSED'
        })), { status: 200 }))
      }

      return Promise.resolve(new Response(JSON.stringify(buildGroup()), { status: 200 }))
    })

    const { pinia, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)

    expect((wrapper.find('input[name="name"]').element as HTMLInputElement).value).toBe('Web Basics')
    expect((wrapper.find('textarea[name="description"]').element as HTMLTextAreaElement).value).toBe('Первичное описание')
    expect((wrapper.find('input[value="BY_REQUEST"]').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(7)
    expect(wrapper.text()).not.toContain('Статус')
    expect(wrapper.text()).not.toContain('Дата')

    await wrapper.find('input[name="name"]').setValue('Updated group')
    await wrapper.find('textarea[name="description"]').setValue('')
    await wrapper.find('input[value="CLOSED"]').setValue()
    await wrapper.find('input[name="chatEnabled"]').setValue(false)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const groupUpdateCall = fetchMock.mock.calls.find(([url, init]) => {
      return url === '/api/v1/groups/group-id' && init?.method === 'PATCH'
    })
    const settingsUpdateCall = fetchMock.mock.calls.find(([url, init]) => {
      return url === '/api/v1/groups/group-id/settings' && init?.method === 'PATCH'
    })

    expect(JSON.parse(String(groupUpdateCall?.[1]?.body))).toEqual({
      name: 'Updated group',
      description: '',
      accessMode: 'CLOSED'
    })
    expect(JSON.parse(String(settingsUpdateCall?.[1]?.body))).toEqual({
      chatEnabled: false,
      lessonsEnabled: true,
      assignmentsEnabled: true,
      scheduleEnabled: true,
      scheduleWeeklyEnabled: true,
      scheduleSpecialEnabled: true,
      usefulLinksEnabled: true
    })
    expect(notifications.items.at(-1)).toMatchObject({
      type: 'success',
      message: 'Настройки группы сохранены'
    })
  })
})
