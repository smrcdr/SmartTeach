import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

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

  it('copies the group code and shows a temporary copied state', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText
      }
    })

    const wrapper = mountPanel(buildGroup({ code: 'TS101' }))
    const codeButton = wrapper.get('[data-testid="group-code-button"]')

    expect(codeButton.text()).toContain('Код TS101')

    await codeButton.trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('TS101')
    expect(codeButton.classes()).toContain('group-hero__code-button--copied')
    expect(wrapper.get('.group-hero__code-text').text()).toBe('Код TS101')
    expect(wrapper.get('.group-hero__code-toast').classes()).toContain('group-hero__code-toast--visible')

    await vi.advanceTimersByTimeAsync(1400)
    await flushPromises()

    expect(codeButton.classes()).not.toContain('group-hero__code-button--copied')
    expect(wrapper.get('.group-hero__code-toast').classes()).not.toContain('group-hero__code-toast--visible')
  })
})
