import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import * as chatsApi from '@/features/chats/api/chats.api'
import ChatsPage from './ChatsPage.vue'

vi.mock('@/features/chats/api/chats.api', () => ({
  listChats: vi.fn(),
  listMessages: vi.fn(),
  createMessage: vi.fn()
}))

describe('ChatsPage', () => {
  it('renders chats and messages from backend API without hardcoded demo data', async () => {
    vi.mocked(chatsApi.listChats).mockResolvedValue([
      {
        id: 'chat-id',
        chatType: 'GROUP',
        groupId: 'group-id',
        title: 'Backend Group Chat',
        createdByUserId: 'user-id',
        lastMessageAt: '2026-04-26T08:20:00.000Z',
        createdAt: '2026-04-26T08:00:00.000Z',
        updatedAt: '2026-04-26T08:20:00.000Z',
        members: []
      }
    ])
    vi.mocked(chatsApi.listMessages).mockResolvedValue([
      {
        id: 'message-id',
        chatId: 'chat-id',
        authorId: 'other-user-id',
        text: 'Сообщение из API',
        files: [],
        editedAt: null,
        deletedAt: null,
        createdAt: '2026-04-26T08:20:00.000Z',
        author: {
          id: 'other-user-id',
          displayName: 'Backend User',
          bio: null,
          avatarUrl: null
        }
      }
    ])

    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.accessToken = 'access-token'
    auth.user = {
      id: 'user-id',
      email: 'student@smarteach.local',
      displayName: 'Student Example',
      bio: null,
      avatarUrl: null
    }

    const wrapper = mount(ChatsPage, {
      global: {
        plugins: [pinia]
      }
    })
    await flushPromises()
    await flushPromises()

    expect(wrapper.find('.chats-shell').exists()).toBe(true)
    expect(wrapper.findAll('.chat-filter').map((button) => button.text())).toEqual(['Все', 'Группы', 'Личные'])
    expect(chatsApi.listChats).toHaveBeenCalledWith(undefined, 'access-token')
    expect(chatsApi.listMessages).toHaveBeenCalledWith('chat-id', 'access-token')
    expect(wrapper.findAll('.chat-list__item')).toHaveLength(1)
    expect(wrapper.text()).toContain('Backend Group Chat')
    expect(wrapper.text()).toContain('Сообщение из API')
    expect(wrapper.text()).not.toContain('Дизайн-системы 2024')
    expect(wrapper.text()).not.toContain('Марина Ковалева')
    expect(wrapper.find('.chat-composer input').attributes('placeholder')).toBe('Написать сообщение...')
  })
})
