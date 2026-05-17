import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Group } from '@/features/groups/api/groups.api'
import * as groupsApi from '@/features/groups/api/groups.api'
import GroupsPage from './GroupsPage.vue'

vi.mock('@/features/groups/composables/useGroups', () => ({
  useGroups: () => ({
    groups: {
      __v_isRef: true,
      value: []
    },
    isLoading: false,
    error: null
  })
}))

vi.mock('@/features/groups/api/groups.api', async (importOriginal) => {
  const actual = await importOriginal<typeof groupsApi>()
  return {
    ...actual,
    getGroupByCode: vi.fn()
  }
})

function buildGroup(): Group {
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
    membersCount: 2,
    viewerMembershipRole: null,
    viewerJoinRequestStatus: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    archivedAt: null,
    deletedAt: null
  }
}

function mountPage() {
  return mount(GroupsPage, {
    global: {
      plugins: [createPinia()],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a class="router-link" :data-to="JSON.stringify(to)"><slot /></a>'
        },
        AppPageHeader: {
          template: '<header><slot name="actions" /></header>'
        },
        GroupCatalogCard: true,
        AppButton: {
          props: ['disabled', 'type'],
          template: '<button :type="type" :disabled="disabled"><slot /></button>'
        },
        EmptyState: true,
        UserPlus: true,
        X: true
      }
    }
  })
}

describe('GroupsPage', () => {
  beforeEach(() => {
    vi.mocked(groupsApi.getGroupByCode).mockReset()
  })

  it('renders the join-by-code action as a visible CTA button with an icon', () => {
    const source = readFileSync(`${process.cwd()}/src/pages/groups/GroupsPage.vue`, 'utf8')

    expect(source).toContain("import { UserPlus, X } from 'lucide-vue-next'")
    expect(source).toContain('class="catalog-page__join-button"')
    expect(source).toContain('@click="openJoinModal"')
    expect(source).toContain('<UserPlus :size="18" />')
    expect(source).toContain('background: var(--color-action-primary-bg);')
    expect(source).toContain('box-shadow: var(--shadow-action-primary);')
  })

  it('opens a join modal and links to the found group preview', async () => {
    vi.mocked(groupsApi.getGroupByCode).mockResolvedValue(buildGroup())

    const wrapper = mountPage()

    await wrapper.get('.catalog-page__join-button').trigger('click')
    await wrapper.get('.join-modal__field input').setValue('WEB101')
    await wrapper.get('.join-modal__form').trigger('submit')
    await flushPromises()

    expect(groupsApi.getGroupByCode).toHaveBeenCalledWith('WEB101', null)
    expect(wrapper.get('.join-modal__result').text()).toContain('Web Basics')
    expect(wrapper.get('.join-modal__result').text()).toContain('Intro course')
    expect(wrapper.get('.join-modal__result').attributes('data-to')).toContain('group-id')
  })

  it('shows a not found message in the modal without rendering an error notification', async () => {
    vi.mocked(groupsApi.getGroupByCode).mockRejectedValue(new Error('Not found'))

    const wrapper = mountPage()

    await wrapper.get('.catalog-page__join-button').trigger('click')
    await wrapper.get('.join-modal__field input').setValue('UNKNOWN')
    await wrapper.get('.join-modal__form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Нет группы с таким ID')
    expect(wrapper.find('.join-modal__result').exists()).toBe(false)
  })
})
