import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { GroupAccessMode, GroupRole, GroupStatus } from '@prisma/client'
import { AuthorizationService } from '../security/authorization.service'

type MockGroupRecord = {
  id: string
  ownerId: string
  accessMode: GroupAccessMode
  status: GroupStatus
  archivedAt: Date | null
  settings: {
    chatEnabled: boolean
    lessonsEnabled: boolean
    assignmentsEnabled: boolean
    scheduleEnabled: boolean
    scheduleWeeklyEnabled: boolean
    scheduleSpecialEnabled: boolean
    usefulLinksEnabled: boolean
  } | null
  members: Array<{
    role: GroupRole
  }>
}

function buildGroupRecord(
  overrides: Partial<MockGroupRecord> = {},
): MockGroupRecord {
  return {
    id: 'group-1',
    ownerId: 'owner-1',
    accessMode: GroupAccessMode.BY_REQUEST,
    status: GroupStatus.ACTIVE,
    archivedAt: null,
    settings: {
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: true,
      scheduleEnabled: true,
      scheduleWeeklyEnabled: true,
      scheduleSpecialEnabled: true,
      usefulLinksEnabled: true,
    },
    members: [
      {
        role: GroupRole.ADMIN,
      },
    ],
    ...overrides,
  }
}

function createAuthorizationService(group: MockGroupRecord | null) {
  return new AuthorizationService({
    group: {
      findUnique: async () => group,
    },
  } as never)
}

test('authorization service returns membership and feature state for allowed access', async () => {
  const service = createAuthorizationService(buildGroupRecord())

  const context = await service.authorizeGroupAccess('group-1', 'user-1', {
    requiredRoles: [GroupRole.ADMIN],
    requiredFeature: ['chatEnabled', 'scheduleEnabled'],
    requireWritable: true,
  })

  assert.equal(context.group.id, 'group-1')
  assert.equal(context.group.status, GroupStatus.ACTIVE)
  assert.equal(context.membership?.role, GroupRole.ADMIN)
  assert.deepEqual(context.settings, {
    chatEnabled: true,
    lessonsEnabled: true,
    assignmentsEnabled: true,
    scheduleEnabled: true,
    scheduleWeeklyEnabled: true,
    scheduleSpecialEnabled: true,
    usefulLinksEnabled: true,
  })
})

test('authorization service rejects missing membership by default', async () => {
  const service = createAuthorizationService(
    buildGroupRecord({
      members: [],
    }),
  )

  await assert.rejects(
    () => service.authorizeGroupAccess('group-1', 'user-1'),
    (error: unknown) => {
      assert.ok(error instanceof ForbiddenException)
      assert.equal(error.message, 'You are not a member of this group')

      return true
    },
  )
})

test('authorization service rejects disabled feature flags and missing roles', async () => {
  const service = createAuthorizationService(
    buildGroupRecord({
      settings: {
        chatEnabled: false,
        lessonsEnabled: true,
        assignmentsEnabled: true,
        scheduleEnabled: true,
        scheduleWeeklyEnabled: true,
        scheduleSpecialEnabled: true,
        usefulLinksEnabled: true,
      },
      members: [
        {
          role: GroupRole.USER,
        },
      ],
    }),
  )

  await assert.rejects(
    () =>
      service.authorizeGroupAccess('group-1', 'user-1', {
        requiredFeature: 'chatEnabled',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ForbiddenException)
      assert.equal(error.message, 'Chats module is disabled for this group')

      return true
    },
  )

  await assert.rejects(
    () =>
      service.authorizeGroupAccess('group-1', 'user-1', {
        requiredRoles: [GroupRole.ADMIN],
        roleErrorMessage: 'Only admins can do this',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ForbiddenException)
      assert.equal(error.message, 'Only admins can do this')

      return true
    },
  )
})

test('authorization service rejects deleted groups and archived writes', async () => {
  const deletedService = createAuthorizationService(
    buildGroupRecord({
      status: GroupStatus.DELETED,
    }),
  )

  await assert.rejects(
    () => deletedService.authorizeGroupAccess('group-1', 'user-1'),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException)
      assert.equal(error.message, 'Group not found')

      return true
    },
  )

  const archivedService = createAuthorizationService(
    buildGroupRecord({
      status: GroupStatus.ARCHIVED,
      archivedAt: new Date('2026-04-01T10:00:00.000Z'),
    }),
  )

  await assert.rejects(
    () =>
      archivedService.authorizeGroupAccess('group-1', 'user-1', {
        requireWritable: true,
      }),
    (error: unknown) => {
      assert.ok(error instanceof ForbiddenException)
      assert.equal(error.message, 'Archived groups are read-only')

      return true
    },
  )
})

test('authorization service enforces ownership checks explicitly', () => {
  const service = createAuthorizationService(buildGroupRecord())

  service.assertOwnership('user-1', 'user-1', 'not used')
  assert.throws(
    () => service.assertOwnership('owner-1', 'user-2', 'Owners only'),
    (error: unknown) => {
      assert.ok(error instanceof ForbiddenException)
      assert.equal(error.message, 'Owners only')

      return true
    },
  )
})
