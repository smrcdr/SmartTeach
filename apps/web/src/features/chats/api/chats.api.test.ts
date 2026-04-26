import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDirectChat, createGroupChat, createMessage } from './chats.api'

describe('chats api', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates direct and group chats through backend endpoints', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 'chat-id' }), { status: 200 }))
    )

    await createDirectChat('user-id', 'access-token')
    await createGroupChat('group-id', { title: 'Общий чат' }, 'access-token')

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/chats/direct', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ userId: 'user-id' })
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/groups/group-id/chats', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ title: 'Общий чат' })
    }))
  })

  it('sends message attachments and reply targets to the backend', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'message-id' }), { status: 201 })
    )
    const payload = {
      text: 'Ответ с файлом',
      fileIds: ['file-id'],
      replyToMessageId: 'reply-message-id'
    }

    await createMessage('chat-id', payload, 'access-token')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/chats/chat-id/messages', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload)
    }))
  })
})
