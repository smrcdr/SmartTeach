import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AssignmentStatus, GroupRole, GroupStatus, LessonStatus, SubmissionStatus } from '@prisma/client'
import { AssignmentsService } from '../modules/assignments/assignments.service'
import { ChatsService } from '../modules/chats/chats.service'
import { GroupsService } from '../modules/groups/groups.service'
import { LessonsService } from '../modules/lessons/lessons.service'

function getPrivateMethod<T extends (...args: any[]) => any>(instance: object, methodName: string): T {
  return Reflect.get(instance, methodName).bind(instance) as T
}

function createAssignmentsService() {
  return new AssignmentsService(
    {
      assignment: {
        findFirst: async () => ({
          id: 'assignment-1',
        }),
      },
      $transaction: async (callback: (tx: any) => Promise<unknown>) =>
        callback({
          $queryRaw: async () => undefined,
          submission: {
            aggregate: async () => ({
              _max: {
                attemptNumber: 2,
              },
            }),
            create: async ({ data }: { data: { attemptNumber: number } }) => {
              assert.equal(data.attemptNumber, 3)

              return {
                id: 'submission-3',
              }
            },
            findFirst: async () => ({
              id: 'submission-3',
              assignmentId: 'assignment-1',
              authorId: 'user-1',
              attemptNumber: 3,
              text: 'Third attempt',
              status: SubmissionStatus.SUBMITTED,
              score: null,
              feedback: null,
              submittedAt: new Date('2026-04-12T12:05:00.000Z'),
              reviewedByUserId: null,
              reviewedAt: null,
              createdAt: new Date('2026-04-12T12:05:00.000Z'),
              updatedAt: new Date('2026-04-12T12:05:00.000Z'),
              files: [],
              author: {
                id: 'user-1',
                displayName: 'Student',
                bio: null,
                avatarFileId: null,
              },
              reviewedByUser: null,
            }),
          },
          submissionFile: {
            deleteMany: async () => undefined,
            upsert: async () => undefined,
          },
        }),
    } as never,
    {
      authorizeGroupAccess: async () => ({
        membership: {
          role: GroupRole.USER,
        },
      }),
      assertOwnership: () => undefined,
    } as never,
    {
      getObjectUrl: async () => '',
    } as never,
  )
}

function createChatsService() {
  return new ChatsService(
    {} as never,
    {} as never,
    {} as never,
    {
      emitMessageCreated: () => undefined,
      emitMessageUpdated: () => undefined,
      emitMessageDeleted: () => undefined,
    } as never,
  )
}

test('direct chat key generation is order-independent and deterministic', () => {
  const service = createChatsService()
  const buildDirectChatKey = getPrivateMethod<(left: string, right: string) => string>(
    service,
    'buildDirectChatKey',
  )

  assert.equal(buildDirectChatKey('user-b', 'user-a'), 'user-a:user-b')
  assert.equal(buildDirectChatKey('user-a', 'user-b'), 'user-a:user-b')
})

test('submission creation calculates the next attempt number from the current maximum', async () => {
  const service = createAssignmentsService()

  const submission = await service.createSubmission('group-1', 'assignment-1', 'user-1', {
    text: 'Third attempt',
    status: SubmissionStatus.SUBMITTED,
  })

  assert.equal(submission.attemptNumber, 3)
  assert.equal(submission.status, SubmissionStatus.SUBMITTED)
  assert.equal(submission.author.id, 'user-1')
})

test('assignment and lesson status transitions keep publication metadata consistent', () => {
  const assignmentsService = new AssignmentsService({} as never, {} as never, {} as never)
  const lessonsService = new LessonsService({} as never, {} as never, {} as never)
  const resolveAssignmentStatusMetadata = getPrivateMethod<
    (
      currentStatus: AssignmentStatus,
      currentPublishedAt: Date | null,
      currentArchivedAt: Date | null,
      nextStatus: AssignmentStatus,
    ) => {
      publishedAt: Date | null
      archivedAt: Date | null
    }
  >(assignmentsService, 'resolveStatusMetadata')
  const resolveLessonStatusMetadata = getPrivateMethod<
    (
      currentStatus: LessonStatus,
      currentPublishedAt: Date | null,
      currentArchivedAt: Date | null,
      nextStatus: LessonStatus,
    ) => {
      publishedAt: Date | null
      archivedAt: Date | null
    }
  >(lessonsService, 'resolveStatusMetadata')
  const publishedAt = new Date('2026-04-10T10:00:00.000Z')
  const archivedAt = new Date('2026-04-11T10:00:00.000Z')

  assert.deepEqual(
    resolveAssignmentStatusMetadata(AssignmentStatus.DRAFT, null, null, AssignmentStatus.DRAFT),
    {
      publishedAt: null,
      archivedAt: null,
    },
  )

  const publishedAssignment = resolveAssignmentStatusMetadata(
    AssignmentStatus.DRAFT,
    null,
    null,
    AssignmentStatus.PUBLISHED,
  )
  assert.ok(publishedAssignment.publishedAt instanceof Date)
  assert.equal(publishedAssignment.archivedAt, null)

  const archivedAssignment = resolveAssignmentStatusMetadata(
    AssignmentStatus.PUBLISHED,
    publishedAt,
    null,
    AssignmentStatus.ARCHIVED,
  )
  assert.equal(archivedAssignment.publishedAt, publishedAt)
  assert.ok(archivedAssignment.archivedAt instanceof Date)

  const resetLesson = resolveLessonStatusMetadata(
    LessonStatus.ARCHIVED,
    publishedAt,
    archivedAt,
    LessonStatus.DRAFT,
  )
  assert.equal(resetLesson.publishedAt, null)
  assert.equal(resetLesson.archivedAt, null)

  const unchangedLesson = resolveLessonStatusMetadata(
    LessonStatus.PUBLISHED,
    publishedAt,
    null,
    LessonStatus.PUBLISHED,
  )
  assert.equal(unchangedLesson.publishedAt, publishedAt)
  assert.equal(unchangedLesson.archivedAt, null)
})

test('group archive state transitions only stamp archivedAt on first archive', () => {
  const service = new GroupsService({} as never, {} as never, {} as never, {} as never)
  const resolveArchivedAt = getPrivateMethod<
    (
      currentArchivedAt: Date | null,
      currentStatus: GroupStatus,
      nextStatus: 'ACTIVE' | 'ARCHIVED',
    ) => Date | null
  >(service, 'resolveArchivedAt')
  const archivedAt = new Date('2026-04-12T08:00:00.000Z')

  const firstArchive = resolveArchivedAt(null, GroupStatus.ACTIVE, 'ARCHIVED')

  assert.ok(firstArchive instanceof Date)
  assert.equal(resolveArchivedAt(archivedAt, GroupStatus.ARCHIVED, 'ARCHIVED'), archivedAt)
  assert.equal(resolveArchivedAt(archivedAt, GroupStatus.ARCHIVED, 'ACTIVE'), null)
})
