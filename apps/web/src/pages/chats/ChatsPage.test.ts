import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import * as chatsApi from '@/features/chats/api/chats.api'
import type { Chat } from '@/features/chats/api/chats.api'
import * as filesApi from '@/shared/api/files.api'
import ChatsPage from './ChatsPage.vue'

vi.mock('@/features/chats/api/chats.api', () => ({
  listChats: vi.fn(),
  listMessages: vi.fn(),
  createMessage: vi.fn()
}))

vi.mock('@/shared/api/files.api', () => ({
  uploadFile: vi.fn()
}))

function buildChat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: 'chat-id',
    chatType: 'GROUP',
    groupId: 'group-id',
    title: 'Backend Group Chat',
    createdByUserId: 'user-id',
    lastMessageAt: '2026-04-26T08:20:00.000Z',
    createdAt: '2026-04-26T08:00:00.000Z',
    updatedAt: '2026-04-26T08:20:00.000Z',
    members: [],
    ...overrides
  }
}

function createAuthorizedPinia() {
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

  return pinia
}

async function mountChatsPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/chats', name: 'chats', component: ChatsPage }
    ]
  })
  router.push('/chats')
  await router.isReady()

  return mount(ChatsPage, {
    global: {
      plugins: [createAuthorizedPinia(), router]
    }
  })
}

describe('ChatsPage', () => {
  it('keeps visible dividers between chat list, messages and composer', () => {
    const source = readFileSync(`${process.cwd()}/src/pages/chats/ChatsPage.vue`, 'utf8')

    expect(source).toContain('border-right: 1px solid var(--color-divider);')
    expect(source).toContain('border-bottom: 1px solid var(--color-divider);')
    expect(source).toContain('border-top: 1px solid var(--color-divider);')
    expect(source).toContain('border: 1px solid var(--chat-incoming-border);')
    expect(source).toContain('max-width: min(47%, 680px);')
    expect(source).toContain('--chat-outgoing-bg: #dceeff;')
  })

  it('renders chats and messages from backend API without hardcoded demo data', async () => {
    vi.mocked(chatsApi.listChats).mockResolvedValue([
      buildChat()
    ])
    vi.mocked(chatsApi.listMessages).mockResolvedValue([
      {
        id: 'message-id',
        chatId: 'chat-id',
        authorId: 'other-user-id',
        text: 'Сообщение из API',
        files: [],
        replyToMessage: null,
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

    const wrapper = await mountChatsPage()
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
    expect(wrapper.find('.chat-composer__field input').attributes('placeholder')).toBe('Написать сообщение...')
  })

  it('switches chat filters through backend chatType queries', async () => {
    const groupChat = buildChat({
      id: 'group-chat',
      chatType: 'GROUP',
      title: 'Групповой чат'
    })
    const directChat = buildChat({
      id: 'direct-chat',
      chatType: 'DIRECT',
      groupId: null,
      title: null,
      members: [
        {
          userId: 'user-id',
          joinedAt: '2026-04-26T08:00:00.000Z',
          lastReadAt: null,
          createdAt: '2026-04-26T08:00:00.000Z',
          updatedAt: '2026-04-26T08:00:00.000Z',
          user: {
            id: 'user-id',
            displayName: 'Student Example',
            bio: null,
            avatarUrl: null
          }
        },
        {
          userId: 'other-user-id',
          joinedAt: '2026-04-26T08:00:00.000Z',
          lastReadAt: null,
          createdAt: '2026-04-26T08:00:00.000Z',
          updatedAt: '2026-04-26T08:00:00.000Z',
          user: {
            id: 'other-user-id',
            displayName: 'Direct Person',
            bio: null,
            avatarUrl: null
          }
        }
      ]
    })

    vi.mocked(chatsApi.listChats).mockImplementation(async (query) => {
      if (query?.chatType === 'DIRECT') {
        return [directChat]
      }

      if (query?.chatType === 'GROUP') {
        return [groupChat]
      }

      return [groupChat, directChat]
    })
    vi.mocked(chatsApi.listMessages).mockResolvedValue([])

    const wrapper = await mountChatsPage()
    await flushPromises()
    await flushPromises()

    await wrapper.findAll('.chat-filter')[2].trigger('click')
    await flushPromises()
    await flushPromises()

    expect(chatsApi.listChats).toHaveBeenLastCalledWith({ chatType: 'DIRECT' }, 'access-token')
    expect(wrapper.findAll('.chat-filter')[2].classes()).toContain('chat-filter--active')
    expect(wrapper.text()).toContain('Direct Person')
    expect(wrapper.text()).not.toContain('2 участников')
    expect(wrapper.text()).not.toContain('Групповой чат')

    await wrapper.findAll('.chat-filter')[1].trigger('click')
    await flushPromises()
    await flushPromises()

    expect(chatsApi.listChats).toHaveBeenLastCalledWith({ chatType: 'GROUP' }, 'access-token')
    expect(wrapper.findAll('.chat-filter')[1].classes()).toContain('chat-filter--active')
    expect(wrapper.text()).toContain('Групповой чат')
    expect(wrapper.text()).not.toContain('Direct Person')
  })

  it('sends replies with uploaded file attachments', async () => {
    vi.mocked(chatsApi.listChats).mockResolvedValue([buildChat()])
    vi.mocked(chatsApi.listMessages).mockResolvedValue([
      {
        id: 'message-id',
        chatId: 'chat-id',
        authorId: 'other-user-id',
        text: 'Исходное сообщение',
        files: [],
        replyToMessage: null,
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
    vi.mocked(filesApi.uploadFile).mockResolvedValue({
      id: 'file-id',
      originalName: 'task.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      uploadedByUserId: 'user-id',
      url: 'https://files.local/task.pdf',
      createdAt: '2026-04-26T08:21:00.000Z'
    })
    vi.mocked(chatsApi.createMessage).mockResolvedValue({
      id: 'reply-id',
      chatId: 'chat-id',
      authorId: 'user-id',
      text: 'Ответ с файлом',
      files: [],
      replyToMessage: {
        id: 'message-id',
        authorId: 'other-user-id',
        text: 'Исходное сообщение',
        deletedAt: null,
        createdAt: '2026-04-26T08:20:00.000Z',
        author: {
          id: 'other-user-id',
          displayName: 'Backend User',
          bio: null,
          avatarUrl: null
        }
      },
      editedAt: null,
      deletedAt: null,
      createdAt: '2026-04-26T08:22:00.000Z',
      author: {
        id: 'user-id',
        displayName: 'Student Example',
        bio: null,
        avatarUrl: null
      }
    })

    const wrapper = await mountChatsPage()
    await flushPromises()
    await flushPromises()

    await wrapper.find('.message__reply').trigger('click')
    await wrapper.find('.chat-composer__field input').setValue('Ответ с файлом')
    const fileInput = wrapper.find('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: [new File(['content'], 'task.pdf', { type: 'application/pdf' })]
    })
    await wrapper.find('input[type="file"]').trigger('change')
    await wrapper.find('.chat-composer').trigger('submit')
    await flushPromises()

    expect(filesApi.uploadFile).toHaveBeenCalledWith(expect.any(File), 'messages', 'access-token')
    expect(chatsApi.createMessage).toHaveBeenCalledWith('chat-id', {
      text: 'Ответ с файлом',
      fileIds: ['file-id'],
      replyToMessageId: 'message-id'
    }, 'access-token')
  })
})
