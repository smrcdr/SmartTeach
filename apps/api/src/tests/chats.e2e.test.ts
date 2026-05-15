import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { GroupRole, PrismaClient } from '@prisma/client'
import { io, type Socket } from 'socket.io-client'
import { createApp } from '../main'
import { AUTH_REFRESH_COOKIE_NAME } from '../modules/auth/auth-refresh-cookie'
import { MinioService } from '../storage/minio/minio.service'
import {
  applyCookieJar,
  createCookieJar,
  getCookieValue,
  storeResponseCookies,
  type CookieJar,
} from './test-cookie-jar'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for chats e2e tests.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})

const createdUserIds = new Set<string>()
const createdGroupIds = new Set<string>()
const createdDirectChatIds = new Set<string>()
const createdFileIds = new Set<string>()
let app: INestApplication
let baseUrl: string

before(async () => {
  app = await createApp({
    enableSwagger: false,
  })

  const minioService = app.get(MinioService)

  minioService.getObjectUrl = async (objectName: string) => {
    return `https://files.smarteach.test/${encodeURIComponent(objectName)}`
  }

  await app.listen(0, '127.0.0.1')
  baseUrl = await app.getUrl()
})

after(async () => {
  if (createdDirectChatIds.size > 0) {
    await prisma.chat.deleteMany({
      where: {
        id: {
          in: [...createdDirectChatIds],
        },
      },
    })
  }

  if (createdGroupIds.size > 0) {
    await prisma.group.deleteMany({
      where: {
        id: {
          in: [...createdGroupIds],
        },
      },
    })
  }

  if (createdFileIds.size > 0) {
    await prisma.file.deleteMany({
      where: {
        id: {
          in: [...createdFileIds],
        },
      },
    })
  }

  if (createdUserIds.size > 0) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [...createdUserIds],
        },
      },
    })
  }

  if (app) {
    await app.close()
  }

  await prisma.$disconnect()
})

type JsonRecord = Record<string, unknown>

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: JsonRecord
  cookieJar?: CookieJar
  token?: string
  headers?: Record<string, string>
}

type AuthSessionResponse = {
  user: {
    id: string
  }
  accessToken: string
}

type GroupResponse = {
  id: string
}

type ChatResponse = {
  id: string
  chatType: 'GROUP' | 'DIRECT'
  groupId: string | null
  title: string | null
  createdByUserId: string
  lastMessageAt: string | null
  members: Array<{
    userId: string
    joinedAt: string
    lastReadAt: string | null
    createdAt: string
    updatedAt: string
    user: {
      id: string
      displayName: string
      bio: string | null
      avatarFileId: string | null
    }
  }>
  createdAt: string
  updatedAt: string
}

type MessageResponse = {
  id: string
  chatId: string
  authorId: string
  text: string | null
  files: Array<{
    id: string
    originalName: string
    mimeType: string
    sizeBytes: number
    uploadedByUserId: string
    url: string
    createdAt: string
  }>
  replyToMessage: {
    id: string
    authorId: string
    text: string | null
    deletedAt: string | null
    createdAt: string
    author: {
      id: string
      displayName: string
    }
  } | null
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
  author: {
    id: string
    displayName: string
  }
}

type ChatSubscriptionResponse =
  | {
      ok: true
      chatId: string
    }
  | {
      ok: false
      error: string
    }

async function request<T = JsonRecord>(
  path: string,
  init: RequestOptions = {},
) {
  const headers = new Headers(init.headers)

  if (init.body !== undefined) {
    headers.set('content-type', 'application/json')
  }

  if (init.token) {
    headers.set('authorization', `Bearer ${init.token}`)
  }
  applyCookieJar(headers, init.cookieJar)

  const response = await fetch(`${baseUrl}/api/v1/${path.replace(/^\//, '')}`, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  storeResponseCookies(response, init.cookieJar)
  const rawBody = await response.text()

  return {
    response,
    body: rawBody.length > 0 ? (JSON.parse(rawBody) as T) : null,
  }
}

async function registerUser(label: string) {
  const email = `chats-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const cookieJar = createCookieJar()
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Chats ${label}`,
    },
    cookieJar,
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  assert.ok(getCookieValue(cookieJar, AUTH_REFRESH_COOKIE_NAME))
  createdUserIds.add(result.body.user.id)

  return {
    ...result.body,
    cookieJar,
  }
}

async function createGroup(
  ownerToken: string,
  options: {
    chatEnabled?: boolean
  } = {},
) {
  const result = await request<GroupResponse>('/groups', {
    method: 'POST',
    token: ownerToken,
    body: {
      name: `Chats Group ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: 'Group for chats API tests.',
      accessMode: 'BY_REQUEST',
      settings: {
        chatEnabled: options.chatEnabled ?? true,
        lessonsEnabled: true,
        assignmentsEnabled: true,
        scheduleEnabled: true,
      },
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdGroupIds.add(result.body.id)

  return result.body
}

async function addGroupMember(groupId: string, userId: string, role: GroupRole) {
  await prisma.groupMember.create({
    data: {
      groupId,
      userId,
      role,
    },
  })
}

async function createOwnedFile(userId: string, label: string) {
  const file = await prisma.file.create({
    data: {
      storageKey: `messages/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${label}.png`,
      originalName: `${label}.png`,
      mimeType: 'image/png',
      sizeBytes: BigInt(2048),
      uploadedByUserId: userId,
    },
    select: {
      id: true,
    },
  })

  createdFileIds.add(file.id)

  return file
}

async function connectChatSocket(accessToken?: string) {
  const socket = io(`${baseUrl}/chat`, {
    transports: ['websocket'],
    reconnection: false,
    auth: accessToken ? { token: accessToken } : undefined,
  })

  return new Promise<Socket>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      socket.disconnect()
      reject(new Error('Timed out while connecting to chat gateway'))
    }, 2_000)

    const cleanup = () => {
      clearTimeout(timeout)
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleError)
    }

    const handleConnect = () => {
      cleanup()
      resolve(socket)
    }

    const handleError = (error: Error) => {
      cleanup()
      socket.disconnect()
      reject(error)
    }

    socket.once('connect', handleConnect)
    socket.once('connect_error', handleError)
  })
}

async function subscribeToChat(socket: Socket, chatId: string) {
  return new Promise<ChatSubscriptionResponse>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out while subscribing to chat room'))
    }, 2_000)

    socket.emit('chat.subscribe', { chatId }, (response: ChatSubscriptionResponse) => {
      clearTimeout(timeout)
      resolve(response)
    })
  })
}

async function waitForSocketEvent<T>(socket: Socket, eventName: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out while waiting for ${eventName}`))
    }, 2_000)

    const cleanup = () => {
      clearTimeout(timeout)
      socket.off(eventName, handleEvent)
    }

    const handleEvent = (payload: T) => {
      cleanup()
      resolve(payload)
    }

    socket.once(eventName, handleEvent)
  })
}

async function waitForOptionalSocketEvent<T>(socket: Socket, eventName: string, timeoutMs = 1_500) {
  return new Promise<T | null>((resolve) => {
    const timeout = setTimeout(() => {
      cleanup()
      resolve(null)
    }, timeoutMs)

    const cleanup = () => {
      clearTimeout(timeout)
      socket.off(eventName, handleEvent)
    }

    const handleEvent = (payload: T) => {
      cleanup()
      resolve(payload)
    }

    socket.once(eventName, handleEvent)
  })
}

function buildDirectChatKey(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join(':')
}

test('group chat endpoints enforce membership, roles and chat_enabled', async () => {
  const owner = await registerUser('group-owner')
  const admin = await registerUser('group-admin')
  const member = await registerUser('group-member')
  const outsider = await registerUser('group-outsider')
  const group = await createGroup(owner.accessToken)

  await addGroupMember(group.id, admin.user.id, GroupRole.ADMIN)
  await addGroupMember(group.id, member.user.id, GroupRole.USER)

  const createResult = await request<ChatResponse>(`/groups/${group.id}/chats`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Общий чат потока',
    },
  })

  assert.equal(createResult.response.status, 201)
  assert.ok(createResult.body)
  assert.equal(createResult.body.chatType, 'GROUP')
  assert.equal(createResult.body.groupId, group.id)
  assert.equal(createResult.body.title, 'Общий чат потока')
  assert.equal(createResult.body.members.length, 3)

  const memberCreateResult = await request(`/groups/${group.id}/chats`, {
    method: 'POST',
    token: member.accessToken,
    body: {
      title: 'Чат без прав',
    },
  })

  assert.equal(memberCreateResult.response.status, 403)

  const memberListResult = await request<ChatResponse[]>(`/groups/${group.id}/chats`, {
    method: 'GET',
    token: member.accessToken,
  })

  assert.equal(memberListResult.response.status, 200)
  assert.ok(memberListResult.body)
  assert.equal(memberListResult.body.length, 1)
  assert.equal(memberListResult.body[0]?.id, createResult.body.id)

  const filteredListResult = await request<ChatResponse[]>(
    `/chats?groupId=${group.id}&chatType=GROUP`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(filteredListResult.response.status, 200)
  assert.ok(filteredListResult.body)
  assert.equal(filteredListResult.body.length, 1)
  assert.equal(filteredListResult.body[0]?.id, createResult.body.id)

  const updateResult = await request<ChatResponse>(`/groups/${group.id}/chats/${createResult.body.id}`, {
    method: 'PATCH',
    token: admin.accessToken,
    body: {
      title: 'Организационный чат',
    },
  })

  assert.equal(updateResult.response.status, 200)
  assert.ok(updateResult.body)
  assert.equal(updateResult.body.title, 'Организационный чат')

  const outsiderListResult = await request(`/groups/${group.id}/chats`, {
    method: 'GET',
    token: outsider.accessToken,
  })

  assert.equal(outsiderListResult.response.status, 403)

  const deleteResult = await request(`/groups/${group.id}/chats/${createResult.body.id}`, {
    method: 'DELETE',
    token: owner.accessToken,
  })

  assert.equal(deleteResult.response.status, 204)
  assert.equal(deleteResult.body, null)

  const listAfterDelete = await request<ChatResponse[]>(`/groups/${group.id}/chats`, {
    method: 'GET',
    token: owner.accessToken,
  })

  assert.equal(listAfterDelete.response.status, 200)
  assert.deepEqual(listAfterDelete.body, [])

  const disabledGroup = await createGroup(owner.accessToken, {
    chatEnabled: false,
  })

  const disabledListResult = await request(`/groups/${disabledGroup.id}/chats`, {
    method: 'GET',
    token: owner.accessToken,
  })

  assert.equal(disabledListResult.response.status, 403)
})

test('direct chats are deduplicated by direct_chat_key and protected by membership', async () => {
  const alice = await registerUser('direct-alice')
  const bob = await registerUser('direct-bob')
  const carol = await registerUser('direct-carol')

  const createResult = await request<ChatResponse>('/chats/direct', {
    method: 'POST',
    token: alice.accessToken,
    body: {
      userId: bob.user.id,
    },
  })

  assert.equal(createResult.response.status, 200)
  assert.ok(createResult.body)
  assert.equal(createResult.body.chatType, 'DIRECT')
  assert.equal(createResult.body.groupId, null)
  assert.equal(createResult.body.members.length, 2)
  createdDirectChatIds.add(createResult.body.id)

  const repeatedCreateResult = await request<ChatResponse>('/chats/direct', {
    method: 'POST',
    token: bob.accessToken,
    body: {
      userId: alice.user.id,
    },
  })

  assert.equal(repeatedCreateResult.response.status, 200)
  assert.ok(repeatedCreateResult.body)
  assert.equal(repeatedCreateResult.body.id, createResult.body.id)

  const duplicateCount = await prisma.chat.count({
    where: {
      directChatKey: buildDirectChatKey(alice.user.id, bob.user.id),
    },
  })

  assert.equal(duplicateCount, 1)

  const listDirectChatsResult = await request<ChatResponse[]>('/chats?chatType=DIRECT', {
    method: 'GET',
    token: alice.accessToken,
  })

  assert.equal(listDirectChatsResult.response.status, 200)
  assert.ok(listDirectChatsResult.body)
  assert.equal(listDirectChatsResult.body.length, 1)
  assert.equal(listDirectChatsResult.body[0]?.id, createResult.body.id)

  const getChatForBobResult = await request<ChatResponse>(`/chats/${createResult.body.id}`, {
    method: 'GET',
    token: bob.accessToken,
  })

  assert.equal(getChatForBobResult.response.status, 200)
  assert.ok(getChatForBobResult.body)
  assert.equal(getChatForBobResult.body.id, createResult.body.id)

  const getChatForCarolResult = await request(`/chats/${createResult.body.id}`, {
    method: 'GET',
    token: carol.accessToken,
  })

  assert.equal(getChatForCarolResult.response.status, 403)

  const selfChatResult = await request('/chats/direct', {
    method: 'POST',
    token: alice.accessToken,
    body: {
      userId: alice.user.id,
    },
  })

  assert.equal(selfChatResult.response.status, 400)
  assert.deepEqual(selfChatResult.body, {
    statusCode: 400,
    message: 'Validation failed',
    errors: ['userId: Direct chat requires another user'],
  })
})

test('chat gateway authenticates clients and streams message events to subscribed members', async () => {
  const owner = await registerUser('ws-owner')
  const member = await registerUser('ws-member')
  const outsider = await registerUser('ws-outsider')
  const group = await createGroup(owner.accessToken)

  await addGroupMember(group.id, member.user.id, GroupRole.USER)

  const chatCreateResult = await request<ChatResponse>(`/groups/${group.id}/chats`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Realtime чат',
    },
  })

  assert.equal(chatCreateResult.response.status, 201)
  assert.ok(chatCreateResult.body)

  await assert.rejects(connectChatSocket(), /Missing access token/)

  const outsiderSocket = await connectChatSocket(outsider.accessToken)

  try {
    const outsiderSubscription = await subscribeToChat(outsiderSocket, chatCreateResult.body.id)

    assert.deepEqual(outsiderSubscription, {
      ok: false,
      error: 'You are not a member of this group',
    })
  } finally {
    outsiderSocket.disconnect()
  }

  const memberSocket = await connectChatSocket(member.accessToken)

  try {
    const subscription = await subscribeToChat(memberSocket, chatCreateResult.body.id)

    assert.deepEqual(subscription, {
      ok: true,
      chatId: chatCreateResult.body.id,
    })

    const createdEventPromise = waitForSocketEvent<MessageResponse>(
      memberSocket,
      'chat.message.created',
    )
    const createMessageResult = await request<MessageResponse>(
      `/chats/${chatCreateResult.body.id}/messages`,
      {
        method: 'POST',
        token: member.accessToken,
        body: {
          text: 'Сообщение для realtime-потока.',
        },
      },
    )

    assert.equal(createMessageResult.response.status, 201)
    assert.ok(createMessageResult.body)

    const createdEvent = await createdEventPromise

    assert.equal(createdEvent.id, createMessageResult.body.id)
    assert.equal(createdEvent.chatId, chatCreateResult.body.id)
    assert.equal(createdEvent.text, 'Сообщение для realtime-потока.')

    const updatedEventPromise = waitForSocketEvent<MessageResponse>(
      memberSocket,
      'chat.message.updated',
    )
    const updateMessageResult = await request<MessageResponse>(
      `/chats/${chatCreateResult.body.id}/messages/${createMessageResult.body.id}`,
      {
        method: 'PATCH',
        token: member.accessToken,
        body: {
          text: 'Сообщение обновлено для realtime-потока.',
        },
      },
    )

    assert.equal(updateMessageResult.response.status, 200)
    assert.ok(updateMessageResult.body)

    const updatedEvent = await updatedEventPromise

    assert.equal(updatedEvent.id, createMessageResult.body.id)
    assert.equal(updatedEvent.text, 'Сообщение обновлено для realtime-потока.')
    assert.ok(updatedEvent.editedAt)

    const deletedEventPromise = waitForSocketEvent<MessageResponse>(
      memberSocket,
      'chat.message.deleted',
    )
    const deleteMessageResult = await request(
      `/chats/${chatCreateResult.body.id}/messages/${createMessageResult.body.id}`,
      {
        method: 'DELETE',
        token: member.accessToken,
      },
    )

    assert.equal(deleteMessageResult.response.status, 204)
    assert.equal(deleteMessageResult.body, null)

    const deletedEvent = await deletedEventPromise

    assert.equal(deletedEvent.id, createMessageResult.body.id)
    assert.ok(deletedEvent.deletedAt)
    assert.equal(deletedEvent.text, null)
    assert.deepEqual(deletedEvent.files, [])
  } finally {
    memberSocket.disconnect()
  }
})

test('chat gateway revokes room access after logout', async () => {
  const owner = await registerUser('ws-logout-owner')
  const member = await registerUser('ws-logout-member')
  const group = await createGroup(owner.accessToken)

  await addGroupMember(group.id, member.user.id, GroupRole.USER)

  const chatCreateResult = await request<ChatResponse>(`/groups/${group.id}/chats`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Realtime logout chat',
    },
  })

  assert.equal(chatCreateResult.response.status, 201)
  assert.ok(chatCreateResult.body)

  const memberSocket = await connectChatSocket(member.accessToken)

  try {
    const initialSubscription = await subscribeToChat(memberSocket, chatCreateResult.body.id)

    assert.deepEqual(initialSubscription, {
      ok: true,
      chatId: chatCreateResult.body.id,
    })

    const logoutResult = await request('/auth/logout', {
      method: 'POST',
      cookieJar: member.cookieJar,
    })

    assert.equal(logoutResult.response.status, 204)

    const resubscribeResult = await subscribeToChat(memberSocket, chatCreateResult.body.id)

    assert.deepEqual(resubscribeResult, {
      ok: false,
      error: 'Unauthorized',
    })

    const unexpectedEventPromise = waitForOptionalSocketEvent<MessageResponse>(
      memberSocket,
      'chat.message.created',
    )
    const createMessageResult = await request<MessageResponse>(
      `/chats/${chatCreateResult.body.id}/messages`,
      {
        method: 'POST',
        token: owner.accessToken,
        body: {
          text: 'Сообщение после logout.',
        },
      },
    )

    assert.equal(createMessageResult.response.status, 201)
    assert.equal(await unexpectedEventPromise, null)
  } finally {
    memberSocket.disconnect()
  }
})

test('chat gateway revokes room access after member removal', async () => {
  const owner = await registerUser('ws-removal-owner')
  const member = await registerUser('ws-removal-member')
  const group = await createGroup(owner.accessToken)

  await addGroupMember(group.id, member.user.id, GroupRole.USER)

  const chatCreateResult = await request<ChatResponse>(`/groups/${group.id}/chats`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Realtime membership chat',
    },
  })

  assert.equal(chatCreateResult.response.status, 201)
  assert.ok(chatCreateResult.body)

  const memberSocket = await connectChatSocket(member.accessToken)

  try {
    const initialSubscription = await subscribeToChat(memberSocket, chatCreateResult.body.id)

    assert.deepEqual(initialSubscription, {
      ok: true,
      chatId: chatCreateResult.body.id,
    })

    const removeMemberResult = await request(
      `/groups/${group.id}/members/${member.user.id}`,
      {
        method: 'DELETE',
        token: owner.accessToken,
      },
    )

    assert.equal(removeMemberResult.response.status, 204)

    const resubscribeResult = await subscribeToChat(memberSocket, chatCreateResult.body.id)

    assert.deepEqual(resubscribeResult, {
      ok: false,
      error: 'You are not a member of this group',
    })

    const unexpectedEventPromise = waitForOptionalSocketEvent<MessageResponse>(
      memberSocket,
      'chat.message.created',
    )
    const createMessageResult = await request<MessageResponse>(
      `/chats/${chatCreateResult.body.id}/messages`,
      {
        method: 'POST',
        token: owner.accessToken,
        body: {
          text: 'Сообщение после удаления участника.',
        },
      },
    )

    assert.equal(createMessageResult.response.status, 201)
    assert.equal(await unexpectedEventPromise, null)
  } finally {
    memberSocket.disconnect()
  }
})

test('message endpoints support attachment sync during edits and hide deleted content', async () => {
  const owner = await registerUser('message-owner')
  const admin = await registerUser('message-admin')
  const member = await registerUser('message-member')
  const group = await createGroup(owner.accessToken)

  await addGroupMember(group.id, admin.user.id, GroupRole.ADMIN)
  await addGroupMember(group.id, member.user.id, GroupRole.USER)

  const chatCreateResult = await request<ChatResponse>(`/groups/${group.id}/chats`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Чат для домашних заданий',
    },
  })

  assert.equal(chatCreateResult.response.status, 201)
  assert.ok(chatCreateResult.body)

  const attachmentFile = await createOwnedFile(member.user.id, 'layout-reference')
  const replacementAttachmentFile = await createOwnedFile(member.user.id, 'layout-replacement')

  const textMessageResult = await request<MessageResponse>(`/chats/${chatCreateResult.body.id}/messages`, {
    method: 'POST',
    token: member.accessToken,
    body: {
      text: 'Первый вариант домашней работы готов.',
    },
  })

  assert.equal(textMessageResult.response.status, 201)
  assert.ok(textMessageResult.body)
  const textMessageId = textMessageResult.body.id
  assert.equal(textMessageResult.body.text, 'Первый вариант домашней работы готов.')
  assert.equal(textMessageResult.body.files.length, 0)
  assert.equal(textMessageResult.body.replyToMessage, null)

  const replyMessageResult = await request<MessageResponse>(`/chats/${chatCreateResult.body.id}/messages`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      text: 'Посмотрю и дам комментарии.',
      replyToMessageId: textMessageId,
    },
  })

  assert.equal(replyMessageResult.response.status, 201)
  assert.ok(replyMessageResult.body)
  assert.equal(replyMessageResult.body.replyToMessage?.id, textMessageId)
  assert.equal(replyMessageResult.body.replyToMessage?.text, 'Первый вариант домашней работы готов.')
  assert.equal(replyMessageResult.body.replyToMessage?.author.id, member.user.id)

  const attachmentMessageResult = await request<MessageResponse>(
    `/chats/${chatCreateResult.body.id}/messages`,
    {
      method: 'POST',
      token: member.accessToken,
      body: {
        fileIds: [attachmentFile.id],
      },
    },
  )

  assert.equal(attachmentMessageResult.response.status, 201)
  assert.ok(attachmentMessageResult.body)
  assert.equal(attachmentMessageResult.body.text, null)
  assert.equal(attachmentMessageResult.body.files.length, 1)
  assert.match(attachmentMessageResult.body.files[0]?.url ?? '', /^https:\/\/files\.smarteach\.test\//)

  const emptyMessageResult = await request(`/chats/${chatCreateResult.body.id}/messages`, {
    method: 'POST',
    token: member.accessToken,
    body: {
      text: '   ',
    },
  })

  assert.equal(emptyMessageResult.response.status, 400)
  assert.deepEqual(emptyMessageResult.body, {
    statusCode: 400,
    message: 'Validation failed',
    errors: ['text: Message must contain text or at least one attachment'],
  })

  const listMessagesResult = await request<MessageResponse[]>(
    `/chats/${chatCreateResult.body.id}/messages?limit=10`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(listMessagesResult.response.status, 200)
  assert.ok(listMessagesResult.body)
  assert.equal(listMessagesResult.body.length, 3)
  assert.equal(listMessagesResult.body[0]?.id, textMessageResult.body.id)
  assert.equal(listMessagesResult.body[1]?.id, replyMessageResult.body.id)
  assert.equal(listMessagesResult.body[1]?.replyToMessage?.id, textMessageResult.body.id)
  assert.equal(listMessagesResult.body[2]?.id, attachmentMessageResult.body.id)

  const chatDetailResult = await request<ChatResponse>(`/chats/${chatCreateResult.body.id}`, {
    method: 'GET',
    token: owner.accessToken,
  })

  assert.equal(chatDetailResult.response.status, 200)
  assert.ok(chatDetailResult.body)
  assert.equal(chatDetailResult.body.lastMessageAt, attachmentMessageResult.body.createdAt)

  const updateMessageResult = await request<MessageResponse>(
    `/chats/${chatCreateResult.body.id}/messages/${textMessageId}`,
    {
      method: 'PATCH',
      token: member.accessToken,
      body: {
        text: 'Обновил первый вариант после комментариев.',
        fileIds: [attachmentFile.id],
      },
    },
  )

  assert.equal(updateMessageResult.response.status, 200)
  assert.ok(updateMessageResult.body)
  assert.equal(updateMessageResult.body.text, 'Обновил первый вариант после комментариев.')
  assert.equal(updateMessageResult.body.files.length, 1)
  assert.equal(updateMessageResult.body.files[0]?.id, attachmentFile.id)
  assert.ok(updateMessageResult.body.editedAt)

  const replaceAttachmentResult = await request<MessageResponse>(
    `/chats/${chatCreateResult.body.id}/messages/${textMessageId}`,
    {
      method: 'PATCH',
      token: member.accessToken,
      body: {
        fileIds: [replacementAttachmentFile.id],
      },
    },
  )

  assert.equal(replaceAttachmentResult.response.status, 200)
  assert.ok(replaceAttachmentResult.body)
  assert.equal(replaceAttachmentResult.body.text, 'Обновил первый вариант после комментариев.')
  assert.equal(replaceAttachmentResult.body.files.length, 1)
  assert.equal(replaceAttachmentResult.body.files[0]?.id, replacementAttachmentFile.id)

  const clearAttachmentsResult = await request<MessageResponse>(
    `/chats/${chatCreateResult.body.id}/messages/${textMessageId}`,
    {
      method: 'PATCH',
      token: member.accessToken,
      body: {
        fileIds: [],
      },
    },
  )

  assert.equal(clearAttachmentsResult.response.status, 200)
  assert.ok(clearAttachmentsResult.body)
  assert.equal(clearAttachmentsResult.body.text, 'Обновил первый вариант после комментариев.')
  assert.deepEqual(clearAttachmentsResult.body.files, [])

  const adminEditResult = await request(
    `/chats/${chatCreateResult.body.id}/messages/${textMessageId}`,
    {
      method: 'PATCH',
      token: admin.accessToken,
      body: {
        text: 'Администратор не должен редактировать чужое сообщение.',
      },
    },
  )

  assert.equal(adminEditResult.response.status, 403)

  const deleteMessageResult = await request(
    `/chats/${chatCreateResult.body.id}/messages/${textMessageResult.body.id}`,
    {
      method: 'DELETE',
      token: admin.accessToken,
    },
  )

  assert.equal(deleteMessageResult.response.status, 204)
  assert.equal(deleteMessageResult.body, null)

  const listAfterDeleteResult = await request<MessageResponse[]>(
    `/chats/${chatCreateResult.body.id}/messages?limit=10`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(listAfterDeleteResult.response.status, 200)
  assert.ok(listAfterDeleteResult.body)
  assert.equal(listAfterDeleteResult.body.length, 3)
  const deletedMessage = listAfterDeleteResult.body.find((message) => message.id === textMessageId)
  assert.ok(deletedMessage)
  assert.ok(deletedMessage.deletedAt)
  assert.equal(deletedMessage.text, null)
  assert.deepEqual(deletedMessage.files, [])
  const replyAfterDelete = listAfterDeleteResult.body.find((message) => message.id === replyMessageResult.body?.id)
  assert.ok(replyAfterDelete)
  assert.equal(replyAfterDelete.replyToMessage?.id, textMessageId)
  assert.equal(replyAfterDelete.replyToMessage?.text, null)
  assert.ok(replyAfterDelete.replyToMessage?.deletedAt)
})
