import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import * as groupsApi from '@/features/groups/api/groups.api'
import MarkdownEditor from './MarkdownEditor.vue'

vi.mock('@/features/groups/api/groups.api', async (importOriginal) => {
  const actual = await importOriginal<typeof groupsApi>()

  return {
    ...actual,
    listLessons: vi.fn(),
    listMaterials: vi.fn()
  }
})

const materials = [
  {
    id: 'section-id',
    groupId: 'group-id',
    title: 'Раздел',
    sortOrder: 1,
    createdByUserId: 'user-id',
    createdAt: '2026-04-28T00:00:00.000Z',
    updatedAt: '2026-04-28T00:00:00.000Z',
    subsections: [
      {
        id: 'subsection-id',
        groupId: 'group-id',
        sectionId: 'section-id',
        title: 'Подраздел',
        sortOrder: 1,
        lessonsCount: 1,
        createdByUserId: 'user-id',
        createdAt: '2026-04-28T00:00:00.000Z',
        updatedAt: '2026-04-28T00:00:00.000Z'
      }
    ]
  }
] satisfies groupsApi.MaterialSection[]

const lessons = [
  {
    id: 'lesson-id',
    groupId: 'group-id',
    materialSubsectionId: 'subsection-id',
    title: 'Введение',
    content: '<p>Текст</p>',
    status: 'PUBLISHED',
    sortOrder: 1,
    publishedAt: '2026-04-28T00:00:00.000Z',
    archivedAt: null,
    createdByUserId: 'user-id',
    files: [],
    createdAt: '2026-04-28T00:00:00.000Z',
    updatedAt: '2026-04-28T00:00:00.000Z'
  }
] satisfies groupsApi.Lesson[]

describe('MarkdownEditor', () => {
  it('reveals lesson link selectors step by step', async () => {
    vi.mocked(groupsApi.listMaterials).mockResolvedValue(materials)
    vi.mocked(groupsApi.listLessons).mockResolvedValue(lessons)

    const wrapper = mount(MarkdownEditor, {
      props: {
        groupId: 'group-id',
        token: 'access-token'
      },
      global: {
        plugins: [createPinia()]
      }
    })

    await wrapper.find('button[title="Вставить ссылку на урок"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.lesson-link-dialog__grid label')).toHaveLength(1)
    expect(wrapper.text()).toContain('Раздел')
    expect(wrapper.text()).not.toContain('Подраздел')

    await wrapper.find('select').setValue('section-id')

    expect(wrapper.findAll('.lesson-link-dialog__grid label')).toHaveLength(2)
    expect(wrapper.text()).toContain('Подраздел')
    expect(wrapper.text()).not.toContain('Урок')

    await wrapper.findAll('select')[1].setValue('subsection-id')

    expect(wrapper.findAll('.lesson-link-dialog__grid label')).toHaveLength(3)
    expect(wrapper.text()).toContain('Урок')
  })
})
