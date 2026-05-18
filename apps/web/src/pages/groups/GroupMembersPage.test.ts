import { mount } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import type { Group, GroupMember } from '@/features/groups/api/groups.api'
import * as chatsApi from '@/features/chats/api/chats.api'
import GroupMembersPage from './GroupMembersPage.vue'

const mockGroup = vi.hoisted(() => ({
  __v_isRef: true,
  value: null as Group | null
}))

const mockMembers = vi.hoisted(() => ({
  __v_isRef: true,
  value: [] as GroupMember[]
}))

vi.mock('@/features/chats/api/chats.api', () => ({
  createDirectChat: vi.fn()
}))

vi.mock('@/features/groups/composables/useGroup', () => ({
  useGroup: () => ({
    group: mockGroup
  })
}))

vi.mock('@/features/groups/composables/useGroupRouteResource', () => ({
  useGroupRouteList: () => ({
    items: mockMembers
  })
}))

function buildGroup(role: Group['viewerMembershipRole'] = 'ADMIN'): Group {
  return {
    id: 'group-id',
    code: 'WEB101',
    name: 'Web Basics',
    description: null,
    ownerId: 'owner-id',
    owner: {
      id: 'owner-id',
      displayName: 'Owner',
      bio: null,
      avatarUrl: null
    },
    accessMode: 'OPEN',
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
    viewerMembershipRole: role,
    viewerJoinRequestStatus: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    archivedAt: null,
    deletedAt: null
  }
}

function buildMember(overrides: Partial<GroupMember> = {}): GroupMember {
  return {
    groupId: 'group-id',
    userId: 'member-id',
    role: 'USER',
    joinedAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    user: {
      id: 'member-id',
      displayName: 'Student One',
      bio: 'Frontend learner',
      avatarUrl: null
    },
    ...overrides
  }
}

async function mountPage() {
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  auth.accessToken = 'access-token'
  auth.user = {
    id: 'current-user-id',
    email: 'current@smarteach.local',
    displayName: 'Current User',
    bio: null,
    avatarUrl: null
  }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/groups/:groupId/workspace/members', name: 'group-members', component: GroupMembersPage },
      { path: '/chats', name: 'chats', component: { template: '<span />' } },
      { path: '/users/:userId', name: 'public-profile', component: { template: '<span />' } }
    ]
  })

  router.push('/groups/group-id/workspace/members')
  await router.isReady()

  return {
    pinia,
    router,
    wrapper: mount(GroupMembersPage, {
      global: {
        plugins: [pinia, router]
      }
    })
  }
}

describe('GroupMembersPage', () => {
  it('opens a minimal invite dialog with the group code', async () => {
    mockGroup.value = buildGroup()
    mockMembers.value = []
    const { wrapper } = await mountPage()

    expect(wrapper.find('.invite-dialog').exists()).toBe(false)

    await wrapper.findAll('button').find((button) => button.text().includes('Пригласить'))?.trigger('click')

    expect(wrapper.find('.invite-dialog').exists()).toBe(true)
    expect(wrapper.find('.invite-dialog__code').text()).toBe('WEB101')

    await wrapper.findAll('.invite-dialog button').find((button) => button.text().includes('Закрыть'))?.trigger('click')

    expect(wrapper.find('.invite-dialog').exists()).toBe(false)
  })

  it('copies invite code and shows a notification', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
    mockGroup.value = buildGroup()
    mockMembers.value = []
    const { pinia, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)

    await wrapper.findAll('button').find((button) => button.text().includes('Пригласить'))?.trigger('click')
    await wrapper.find('.invite-dialog__code').trigger('click')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('WEB101')
    expect(notifications.items.at(-1)).toMatchObject({
      type: 'success',
      message: 'Код скопирован'
    })
  })

  it('opens or creates a direct chat from a selected member context menu', async () => {
    mockGroup.value = buildGroup()
    mockMembers.value = [buildMember()]
    vi.mocked(chatsApi.createDirectChat).mockResolvedValue({
      id: 'chat-id',
      chatType: 'DIRECT',
      groupId: null,
      title: null,
      createdByUserId: 'current-user-id',
      lastMessageAt: null,
      members: [],
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z'
    })
    const { router, wrapper } = await mountPage()

    await wrapper.find('.member-row').trigger('contextmenu')
    expect(wrapper.find('.member-menu').exists()).toBe(true)

    await wrapper.findAll('.member-menu button').find((button) => button.text().includes('Написать'))?.trigger('click')
    await flushPromises()

    expect(chatsApi.createDirectChat).toHaveBeenCalledWith('member-id', 'access-token')
    expect(router.currentRoute.value.name).toBe('chats')
    expect(router.currentRoute.value.query.chatId).toBe('chat-id')
  })

  it('positions the member action menu under the right click point', async () => {
    mockGroup.value = buildGroup()
    mockMembers.value = [buildMember()]
    const { wrapper } = await mountPage()

    await wrapper.find('.member-row').trigger('contextmenu', {
      clientX: 140,
      clientY: 220
    })

    expect(wrapper.find('.member-menu').attributes('style')).toContain('left: 140px; top: 228px;')
  })

  it('opens public profile from the selected member menu', async () => {
    mockGroup.value = buildGroup()
    mockMembers.value = [buildMember()]
    const { router, wrapper } = await mountPage()

    await wrapper.find('.member-row').trigger('contextmenu')
    await wrapper.findAll('.member-menu button').find((button) => button.text().includes('Открыть профиль'))?.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('public-profile')
    expect(router.currentRoute.value.params.userId).toBe('member-id')
  })

  it('does not open the member menu on left row click and opens it from the dots button', async () => {
    mockGroup.value = buildGroup()
    mockMembers.value = [buildMember()]
    const { wrapper } = await mountPage()

    await wrapper.find('.member-row').trigger('click')
    expect(wrapper.find('.member-menu').exists()).toBe(false)

    await wrapper.find('.member-row__actions').trigger('click')
    expect(wrapper.find('.member-menu').exists()).toBe(true)
  })
})
