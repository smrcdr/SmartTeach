import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, test } from 'node:test'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  ChatType,
  GroupAccessMode,
  GroupRole,
  GroupStatus,
  Prisma,
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
    sofia: '44444444-4444-4444-8444-444444444444',
    nina: '55555555-5555-4555-8555-555555555555',
  },
  groups: {
    webBasics: '66666666-6666-4666-8666-666666666666',
    mathLab: '77777777-7777-4777-8777-777777777777',
    archivedClub: '88888888-8888-4888-8888-888888888888',
  },
  lessons: {
    webIntro: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    mathWorkshop: 'bbbbbbb3-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
  },
  assignments: {
    webHomework: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
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

async function expectUniqueConstraintFailure(
  operation: Promise<unknown>,
  expectedFragments: string[],
) {
  try {
    await operation
    assert.fail(
      `Expected operation to fail with a unique constraint containing one of: ${expectedFragments.join(', ')}`,
    )
  } catch (error) {
    assert.ok(error instanceof Prisma.PrismaClientKnownRequestError)
    assert.equal(error.code, 'P2002')

    const errorText = collectErrorText(error)

    assert.ok(
      expectedFragments.some((fragment) => errorText.includes(fragment)),
      `Expected unique constraint error to include one of "${expectedFragments.join(', ')}", received: ${errorText}`,
    )
  }
}

async function createGroupWithSettings(settings: {
  lessonsEnabled?: boolean
  assignmentsEnabled?: boolean
  scheduleEnabled?: boolean
}) {
  const groupId = randomUUID()

  await prisma.$transaction(async (tx) => {
    await tx.group.create({
      data: {
        id: groupId,
        code: `FLAG-${groupId.slice(0, 8)}`,
        name: 'Feature flags test group',
        ownerId: seededIds.users.alex,
        accessMode: GroupAccessMode.OPEN,
        status: GroupStatus.ACTIVE,
      },
    })

    await tx.groupSettings.create({
      data: {
        groupId,
        lessonsEnabled: settings.lessonsEnabled ?? true,
        assignmentsEnabled: settings.assignmentsEnabled ?? true,
        scheduleEnabled: settings.scheduleEnabled ?? true,
      },
    })

    await tx.groupMember.create({
      data: {
        groupId,
        userId: seededIds.users.alex,
        role: GroupRole.OWNER,
      },
    })
  })

  return groupId
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

test('rejects groups with more than one OWNER member', async () => {
  await expectUniqueConstraintFailure(
    prisma.groupMember.create({
      data: {
        groupId: seededIds.groups.webBasics,
        userId: seededIds.users.maria,
        role: GroupRole.OWNER,
      },
    }),
    ['group_members_one_owner_per_group_idx', 'Unique constraint failed'],
  )
})

test('rejects assignment lesson targets from another group', async () => {
  const assignmentId = randomUUID()

  await expectFailure(
    prisma.$transaction(async (tx) => {
      await tx.assignment.create({
        data: {
          id: assignmentId,
          groupId: seededIds.groups.webBasics,
          title: 'Cross-group assignment',
          createdByUserId: seededIds.users.alex,
        },
      })

      await tx.assignmentLessonTarget.create({
        data: {
          assignmentId,
          lessonId: seededIds.lessons.mathWorkshop,
          sortOrder: 1,
        },
      })
    }),
    'must belong to group',
  )
})

test('rejects lessons when lessons_enabled is false', async (t) => {
  const groupId = await createGroupWithSettings({
    lessonsEnabled: false,
  })

  t.after(async () => {
    await prisma.group.deleteMany({
      where: {
        id: groupId,
      },
    })
  })

  await expectFailure(
    prisma.lesson.create({
      data: {
        id: randomUUID(),
        groupId,
        title: 'Disabled lessons',
        sortOrder: 1,
        createdByUserId: seededIds.users.alex,
      },
    }),
    'has lessons_enabled disabled',
  )
})

test('rejects assignments when assignments_enabled is false', async (t) => {
  const groupId = await createGroupWithSettings({
    assignmentsEnabled: false,
  })

  t.after(async () => {
    await prisma.group.deleteMany({
      where: {
        id: groupId,
      },
    })
  })

  await expectFailure(
    prisma.assignment.create({
      data: {
        id: randomUUID(),
        groupId,
        title: 'Disabled assignments',
        createdByUserId: seededIds.users.alex,
      },
    }),
    'has assignments_enabled disabled',
  )
})

test('rejects schedule events when schedule_enabled is false', async () => {
  await expectFailure(
    prisma.scheduleEvent.create({
      data: {
        id: randomUUID(),
        groupId: seededIds.groups.archivedClub,
        title: 'Disabled schedule',
        startsAt: new Date('2026-03-02T10:00:00.000Z'),
        endsAt: new Date('2026-03-02T11:00:00.000Z'),
        createdByUserId: seededIds.users.alex,
      },
    }),
    'has schedule_enabled disabled',
  )
})

test('rejects schedule events that duplicate assignment-derived entries', async () => {
  await expectFailure(
    prisma.scheduleEvent.create({
      data: {
        id: randomUUID(),
        groupId: seededIds.groups.webBasics,
        title: 'Собрать лендинг по макету',
        startsAt: new Date('2026-03-23T20:00:00.000Z'),
        endsAt: new Date('2026-03-23T20:00:00.000Z'),
        createdByUserId: seededIds.users.alex,
      },
    }),
    'duplicates assignment-derived schedule entry',
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

test('rejects a second active PENDING join request for the same user and group', async () => {
  await expectUniqueConstraintFailure(
    prisma.groupJoinRequest.create({
      data: {
        id: randomUUID(),
        groupId: seededIds.groups.mathLab,
        userId: seededIds.users.sofia,
        status: 'PENDING',
      },
    }),
    ['group_join_requests_one_pending_idx', 'Unique constraint failed'],
  )
})

test('rejects duplicate attempt_number within the same assignment and author pair', async () => {
  await expectUniqueConstraintFailure(
    prisma.submission.create({
      data: {
        id: randomUUID(),
        assignmentId: seededIds.assignments.webHomework,
        authorId: seededIds.users.ivan,
        attemptNumber: 2,
        status: 'SUBMITTED',
      },
    }),
    ['attempt_number', 'attemptNumber', 'Unique constraint failed'],
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
