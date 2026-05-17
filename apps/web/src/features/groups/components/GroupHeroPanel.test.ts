import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Group } from '../api/groups.api'
import GroupHeroPanel from './GroupHeroPanel.vue'

function buildGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'group-id',
    code: 'WEB101',
    name: 'Web Basics',
    description: 'Intro course',
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
    membersCount: 4,
    viewerMembershipRole: null,
    viewerJoinRequestStatus: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    ...overrides
  }
}

function mountPanel(group: Group) {
  return mount(GroupHeroPanel, {
    props: {
      group
    },
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a><slot /></a>'
        }
      }
    }
  })
}

describe('GroupHeroPanel', () => {
  it('shows a join button for open groups when the viewer is not a member', async () => {
    const wrapper = mountPanel(buildGroup({ accessMode: 'OPEN' }))

    const action = wrapper.get('[data-testid="group-access-action"]')
    expect(action.text()).toContain('Вступить')

    await action.trigger('click')

    expect(wrapper.emitted('join')).toHaveLength(1)
  })

  it('shows a request button for groups that require approval', async () => {
    const wrapper = mountPanel(buildGroup({ accessMode: 'BY_REQUEST' }))

    const action = wrapper.get('[data-testid="group-access-action"]')
    expect(action.text()).toContain('Подать заявку')

    await action.trigger('click')

    expect(wrapper.emitted('join')).toHaveLength(1)
  })

  it('keeps the workspace entry point only for existing members', () => {
    const wrapper = mountPanel(buildGroup({ viewerMembershipRole: 'USER' }))

    expect(wrapper.text()).toContain('Открыть группу')
    expect(wrapper.find('[data-testid="group-access-action"]').exists()).toBe(false)
  })

  it('does not allow duplicate pending requests from the preview', () => {
    const wrapper = mountPanel(buildGroup({
      accessMode: 'BY_REQUEST',
      viewerJoinRequestStatus: 'PENDING'
    }))

    const action = wrapper.get('[data-testid="group-access-action"]')
    expect(action.text()).toContain('Заявка отправлена')
    expect(action.attributes('disabled')).toBeDefined()
  })
})
