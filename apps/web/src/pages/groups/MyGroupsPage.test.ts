import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Group } from '@/features/groups/api/groups.api'
import MyGroupsPage from './MyGroupsPage.vue'

const groupsState = vi.hoisted(() => ({
  groups: [] as Group[]
}))

vi.mock('@/features/groups/composables/useGroups', () => ({
  useGroups: () => ({
    groups: {
      __v_isRef: true,
      get value() {
        return groupsState.groups
      }
    },
    isLoading: false,
    error: null
  })
}))

function buildGroup(id: string, role: Group['viewerMembershipRole'], name: string): Group {
  return {
    id,
    code: id.toUpperCase(),
    name,
    description: 'Описание группы',
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

describe('MyGroupsPage', () => {
  beforeEach(() => {
    groupsState.groups = []
  })

  it('filters groups by the selected ownership category', async () => {
    groupsState.groups = [
      buildGroup('owner-group', 'OWNER', 'Авторская группа'),
      buildGroup('admin-group', 'ADMIN', 'Администрируемая группа'),
      buildGroup('member-group', 'USER', 'Группа участника')
    ]

    const wrapper = mount(MyGroupsPage, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a><slot /></a>'
          },
          AppButton: {
            template: '<button><slot /></button>'
          },
          AppPageHeader: {
            template: '<header><slot name="actions" /></header>'
          },
          EmptyState: {
            props: ['title', 'description'],
            template: '<section class="empty-state">{{ title }} {{ description }}</section>'
          }
        }
      }
    })

    expect(wrapper.find('.my-groups__list').text()).toContain('Авторская группа')
    expect(wrapper.find('.my-groups__list').text()).toContain('Администрируемая группа')
    expect(wrapper.find('.my-groups__list').text()).toContain('Группа участника')

    await wrapper.findAll('.my-groups__filter-button').find((button) => button.text().includes('Я владелец'))?.trigger('click')

    expect(wrapper.find('.my-groups__list').text()).toContain('Авторская группа')
    expect(wrapper.find('.my-groups__list').text()).not.toContain('Администрируемая группа')
    expect(wrapper.find('.my-groups__list').text()).not.toContain('Группа участника')

    await wrapper.findAll('.my-groups__filter-button').find((button) => button.text().includes('Я участник'))?.trigger('click')

    expect(wrapper.find('.my-groups__list').text()).not.toContain('Авторская группа')
    expect(wrapper.find('.my-groups__list').text()).toContain('Администрируемая группа')
    expect(wrapper.find('.my-groups__list').text()).toContain('Группа участника')
  })

  it('searches groups like the catalog page before applying the ownership filter', async () => {
    groupsState.groups = [
      buildGroup('owner-group', 'OWNER', 'Авторская группа'),
      buildGroup('admin-group', 'ADMIN', 'Администрируемая группа'),
      buildGroup('member-group', 'USER', 'Группа участника')
    ]

    const wrapper = mount(MyGroupsPage, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a><slot /></a>'
          },
          AppButton: {
            template: '<button><slot /></button>'
          },
          AppPageHeader: {
            template: '<header><slot name="actions" /></header>'
          },
          EmptyState: {
            props: ['title', 'description'],
            template: '<section class="empty-state">{{ title }} {{ description }}</section>'
          }
        }
      }
    })

    await wrapper.find('.my-groups__search-input').setValue('администрируемая')

    expect(wrapper.find('.my-groups__list').text()).not.toContain('Авторская группа')
    expect(wrapper.find('.my-groups__list').text()).toContain('Администрируемая группа')
    expect(wrapper.find('.my-groups__list').text()).not.toContain('Группа участника')

    await wrapper.findAll('.my-groups__filter-button').find((button) => button.text().includes('Я владелец'))?.trigger('click')

    expect(wrapper.find('.my-groups__list').text()).toContain('Группы не найдены')
    expect(wrapper.find('.my-groups__list').text()).not.toContain('Администрируемая группа')
  })
})
