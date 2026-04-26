import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { Group } from '@/features/groups/api/groups.api'
import GroupMembersPage from './GroupMembersPage.vue'

const mockGroup = vi.hoisted(() => ({
  __v_isRef: true,
  value: null as Group | null
}))

vi.mock('@/features/groups/composables/useGroup', () => ({
  useGroup: () => ({
    group: mockGroup
  })
}))

vi.mock('@/features/groups/composables/useGroupRouteResource', () => ({
  useGroupRouteList: () => ({
    items: []
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
      scheduleEnabled: true
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

describe('GroupMembersPage', () => {
  it('opens a minimal invite dialog with the group code', async () => {
    mockGroup.value = buildGroup()
    const wrapper = mount(GroupMembersPage)

    expect(wrapper.find('.invite-dialog').exists()).toBe(false)

    await wrapper.findAll('button').find((button) => button.text().includes('Пригласить'))?.trigger('click')

    expect(wrapper.find('.invite-dialog').exists()).toBe(true)
    expect(wrapper.find('.invite-dialog__code').text()).toBe('WEB101')

    await wrapper.find('.invite-dialog button').trigger('click')

    expect(wrapper.find('.invite-dialog').exists()).toBe(false)
  })
})
