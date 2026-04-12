import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, test } from 'node:test'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  ChatType,
  GroupAccessMode,
  GroupRole,
  GroupStatus,
  PrismaClient,
} from '@prisma/client'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for domain constraint tests.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})

const seededIds = {
  users: {
    alex: '11111111-1111-4111-8111-111111111111',
    maria: '22222222-2222-4222-8222-222222222222',
    ivan: '33333333-3333-4333-8333-333333333333',
    nina: '55555555-5555-4555-8555-555555555555',
  },
  groups: {
    webBasics: '66666666-6666-4666-8666-666666666666',
    mathLab: '77777777-7777-4777-8777-777777777777',
  },
  lessons: {
    mathWorkshop: 'bbbbbbb3-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
  },
  chats: {
    webGroup: 'fffffff1-ffff-4fff-8fff-fffffffffff1',
  },
  files: {
    groupChatAttachment: 'aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
  },
} as const

after(async () => {
  await prisma.$disconnect()
})

function collectErrorText(error: unknown, seen = new Set<unknown>()) {
  if (error === null || error === undefined || seen.has(error)) {
    return ''
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error !== 'object') {
    return String(error)
  }

  seen.add(error)

  const parts: string[] = []

  if (error instanceof AggregateError) {
    for (const nestedError of error.errors) {
      parts.push(collectErrorText(nestedError, seen))
    }
  }

  if (error instanceof Error) {
    parts.push(error.message)
    // Prisma and Node may hide the useful detail under cause.
    parts.push(collectErrorText((error as Error & { cause?: unknown }).cause, seen))
  }

  if ('message' in error && typeof error.message === 'string') {
    parts.push(error.message)
  }

  if ('meta' in error) {
    parts.push(collectErrorText(error.meta, seen))
  }

  if ('error' in error) {
    parts.push(collectErrorText(error.error, seen))
  }

  if ('errors' in error && Array.isArray(error.errors)) {
    for (const nestedError of error.errors) {
      parts.push(collectErrorText(nestedError, seen))
    }
  }

  return parts.filter(Boolean).join(' | ')
}

async function expectFailure(operation: Promise<unknown>, expectedMessage: string) {
  try {
    await operation
    assert.fail(`Expected operation to fail with "${expectedMessage}"`)
  } catch (error) {
    const errorText = collectErrorText(error)

    assert.ok(
      errorText.includes(expectedMessage),
      `Expected error to include "${expectedMessage}", received: ${errorText}`,
    )
  }
}

test('rejects group commits without group_settings', async () => {
  const groupId = randomUUID()

  await expectFailure(
    prisma.$transaction(async (tx) => {
      await tx.group.create({
        data: {
          id: groupId,
          code: `NOSET-${groupId.slice(0, 8)}`,
          name: 'Missing settings',
          ownerId: seededIds.users.alex,
          accessMode: GroupAccessMode.OPEN,
          status: GroupStatus.ACTIVE,
        },
      })

      await tx.groupMember.create({
        data: {
          groupId,
          userId: seededIds.users.alex,
          role: GroupRole.OWNER,
        },
      })
    }),
    'must have a group_settings row',
  )
})

test('rejects group commits when owner is not a member with OWNER role', async () => {
  const groupId = randomUUID()

  await expectFailure(
    prisma.$transaction(async (tx) => {
      await tx.group.create({
        data: {
          id: groupId,
          code: `NOMBR-${groupId.slice(0, 8)}`,
          name: 'Owner missing',
          ownerId: seededIds.users.alex,
          accessMode: GroupAccessMode.OPEN,
          status: GroupStatus.ACTIVE,
        },
      })

      await tx.groupSettings.create({
        data: {
          groupId,
        },
      })
    }),
    'must be a group member with OWNER role',
  )
})

test('rejects assignments linked to a lesson from another group', async () => {
  await expectFailure(
    prisma.assignment.create({
      data: {
        id: randomUUID(),
        groupId: seededIds.groups.webBasics,
        lessonId: seededIds.lessons.mathWorkshop,
        title: 'Cross-group assignment',
        createdByUserId: seededIds.users.alex,
      },
    }),
    'must belong to group',
  )
})

test('rejects join requests for non-BY_REQUEST groups', async () => {
  await expectFailure(
    prisma.groupJoinRequest.create({
      data: {
        id: randomUUID(),
        groupId: seededIds.groups.webBasics,
        userId: seededIds.users.nina,
      },
    }),
    'Join requests are allowed only for BY_REQUEST groups',
  )
})

test('rejects direct chats that do not end up with exactly two members', async () => {
  const chatId = randomUUID()

  await expectFailure(
    prisma.$transaction(async (tx) => {
      await tx.chat.create({
        data: {
          id: chatId,
          chatType: ChatType.DIRECT,
          directChatKey: `direct:${randomUUID()}`,
          createdByUserId: seededIds.users.alex,
        },
      })

      await tx.chatMember.create({
        data: {
          chatId,
          userId: seededIds.users.alex,
        },
      })
    }),
    'must have exactly two members',
  )
})

test('allows creating a valid direct chat with exactly two members', async (t) => {
  const chatId = randomUUID()

  t.after(async () => {
    await prisma.chat.deleteMany({
      where: {
        id: chatId,
      },
    })
  })

  await prisma.$transaction(async (tx) => {
    await tx.chat.create({
      data: {
        id: chatId,
        chatType: ChatType.DIRECT,
        directChatKey: `direct:${randomUUID()}`,
        createdByUserId: seededIds.users.alex,
      },
    })

    await tx.chatMember.createMany({
      data: [
        {
          chatId,
          userId: seededIds.users.alex,
        },
        {
          chatId,
          userId: seededIds.users.ivan,
        },
      ],
    })
  })

  const memberCount = await prisma.chatMember.count({
    where: {
      chatId,
    },
  })

  assert.equal(memberCount, 2)
})

test('rejects messages without text and without attachments', async () => {
  await expectFailure(
    prisma.message.create({
      data: {
        id: randomUUID(),
        chatId: seededIds.chats.webGroup,
        authorId: seededIds.users.alex,
      },
    }),
    'must contain text or at least one attachment',
  )
})

test('allows attachment-only messages when the file is linked in the same transaction', async (t) => {
  const messageId = randomUUID()

  t.after(async () => {
    await prisma.message.deleteMany({
      where: {
        id: messageId,
      },
    })
  })

  await prisma.$transaction(async (tx) => {
    await tx.message.create({
      data: {
        id: messageId,
        chatId: seededIds.chats.webGroup,
        authorId: seededIds.users.alex,
      },
    })

    await tx.messageFile.create({
      data: {
        messageId,
        fileId: seededIds.files.groupChatAttachment,
      },
    })
  })

  const messageWithFiles = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
    include: {
      files: true,
    },
  })

  assert.ok(messageWithFiles)
  assert.equal(messageWithFiles.files.length, 1)
})

test('keeps valid group creation possible when settings and owner membership are written in one transaction', async (t) => {
  const groupId = randomUUID()

  t.after(async () => {
    await prisma.group.deleteMany({
      where: {
        id: groupId,
      },
    })
  })

  await prisma.$transaction(async (tx) => {
    await tx.group.create({
      data: {
        id: groupId,
        code: `VALID-${groupId.slice(0, 8)}`,
        name: 'Valid constrained group',
        ownerId: seededIds.users.maria,
        accessMode: GroupAccessMode.BY_REQUEST,
        status: GroupStatus.ACTIVE,
      },
    })

    await tx.groupSettings.create({
      data: {
        groupId,
      },
    })

    await tx.groupMember.create({
      data: {
        groupId,
        userId: seededIds.users.maria,
        role: GroupRole.OWNER,
      },
    })
  })

  const createdGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      settings: true,
      members: true,
    },
  })

  assert.ok(createdGroup?.settings)
  assert.equal(createdGroup?.members.length, 1)
  assert.equal(createdGroup?.members[0]?.role, GroupRole.OWNER)
})
