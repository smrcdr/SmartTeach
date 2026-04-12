import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AssignmentStatus, GroupRole, Prisma, SubmissionStatus } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { AuthorizationService } from '../../security/authorization.service'
import { MinioService } from '../../storage/minio/minio.service'
import { buildAvatarUrlByFileId } from '../users/user-avatar.utils'
import { CreateSubmissionRequestDto } from './dto/create-submission-request.dto'
import { ListSubmissionsQueryDto } from './dto/list-submissions-query.dto'
import { SubmissionDto } from './dto/submission.dto'
import { AssignmentDto } from './dto/assignment.dto'
import { CreateAssignmentRequestDto } from './dto/create-assignment-request.dto'
import { ListAssignmentsQueryDto } from './dto/list-assignments-query.dto'
import { UpdateAssignmentRequestDto } from './dto/update-assignment-request.dto'
import { UpdateSubmissionRequestDto } from './dto/update-submission-request.dto'
import { AssignmentRecord, assignmentSelect, mapAssignmentToDto } from './assignments.mapper'
import { SubmissionRecord, mapSubmissionToDto, submissionSelect } from './submissions.mapper'

const ASSIGNMENT_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])

type PrismaExecutor = Prisma.TransactionClient | PrismaService

@Injectable()
export class AssignmentsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(AuthorizationService)
    private readonly authorizationService: AuthorizationService,
    @Inject(MinioService) private readonly minioService: MinioService,
  ) {}

  async listAssignments(
    groupId: string,
    userId: string,
    query: ListAssignmentsQueryDto,
  ): Promise<AssignmentDto[]> {
    await this.assertGroupAccess(groupId, userId)

    const assignments = await this.prismaService.assignment.findMany({
      where: {
        groupId,
        ...(query.status !== undefined
          ? {
              status: query.status,
            }
          : {}),
        ...(query.lessonId !== undefined
          ? {
              lessonId: query.lessonId,
            }
          : {}),
      },
      select: assignmentSelect,
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    })

    return Promise.all(assignments.map((assignment) => this.mapAssignmentRecordToDto(assignment)))
  }

  async createAssignment(
    groupId: string,
    userId: string,
    payload: CreateAssignmentRequestDto,
  ): Promise<AssignmentDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const status = payload.status ?? AssignmentStatus.DRAFT
    const fileIds = this.normalizeFileIds(payload.fileIds)

    if (payload.lessonId) {
      await this.assertLessonBelongsToGroup(groupId, payload.lessonId)
    }

    await this.assertAttachableFiles(fileIds, groupId)

    const assignment = await this.prismaService.$transaction(async (tx) => {
      const createdAssignment = await tx.assignment.create({
        data: {
          groupId,
          lessonId: payload.lessonId ?? null,
          title: payload.title,
          content: this.normalizeNullableText(payload.content),
          status,
          dueAt: payload.dueAt ? new Date(payload.dueAt) : null,
          maxScore: payload.maxScore ?? null,
          publishedAt: status === AssignmentStatus.PUBLISHED ? new Date() : null,
          archivedAt: status === AssignmentStatus.ARCHIVED ? new Date() : null,
          createdByUserId: userId,
        },
        select: {
          id: true,
        },
      })

      await this.syncAssignmentFiles(tx, createdAssignment.id, fileIds)

      return this.getAssignmentRecordOrThrow(tx, groupId, createdAssignment.id)
    })

    return this.mapAssignmentRecordToDto(assignment)
  }

  async getAssignment(groupId: string, assignmentId: string, userId: string): Promise<AssignmentDto> {
    await this.assertGroupAccess(groupId, userId)

    const assignment = await this.getAssignmentRecordOrThrow(
      this.prismaService,
      groupId,
      assignmentId,
    )

    return this.mapAssignmentRecordToDto(assignment)
  }

  async updateAssignment(
    groupId: string,
    assignmentId: string,
    userId: string,
    payload: UpdateAssignmentRequestDto,
  ): Promise<AssignmentDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const existingAssignment = await this.getAssignmentRecordOrThrow(
      this.prismaService,
      groupId,
      assignmentId,
    )
    const fileIds = payload.fileIds !== undefined ? this.normalizeFileIds(payload.fileIds) : undefined

    if (payload.lessonId !== undefined && payload.lessonId !== null) {
      await this.assertLessonBelongsToGroup(groupId, payload.lessonId)
    }

    if (fileIds !== undefined) {
      await this.assertAttachableFiles(fileIds, groupId, assignmentId)
    }

    const nextStatus = payload.status ?? existingAssignment.status
    const statusMetadata = this.resolveStatusMetadata(
      existingAssignment.status,
      existingAssignment.publishedAt,
      existingAssignment.archivedAt,
      nextStatus,
    )
    const data: Prisma.AssignmentUpdateInput = {
      ...(payload.lessonId !== undefined
        ? {
            lesson:
              payload.lessonId === null
                ? {
                    disconnect: true,
                  }
                : {
                    connect: {
                      id: payload.lessonId,
                    },
                  },
          }
        : {}),
      ...(payload.title !== undefined
        ? {
            title: payload.title,
          }
        : {}),
      ...(payload.content !== undefined
        ? {
            content: this.normalizeNullableText(payload.content),
          }
        : {}),
      ...(payload.status !== undefined
        ? {
            status: payload.status,
            publishedAt: statusMetadata.publishedAt,
            archivedAt: statusMetadata.archivedAt,
          }
        : {}),
      ...(payload.dueAt !== undefined
        ? {
            dueAt: new Date(payload.dueAt),
          }
        : {}),
      ...(payload.maxScore !== undefined
        ? {
            maxScore: payload.maxScore,
          }
        : {}),
    }

    if (Object.keys(data).length === 0 && fileIds === undefined) {
      return this.mapAssignmentRecordToDto(existingAssignment)
    }

    const updatedAssignment = await this.prismaService.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.assignment.update({
          where: {
            id: assignmentId,
          },
          data,
        })
      }

      if (fileIds !== undefined) {
        await this.syncAssignmentFiles(tx, assignmentId, fileIds)
      }

      return this.getAssignmentRecordOrThrow(tx, groupId, assignmentId)
    })

    return this.mapAssignmentRecordToDto(updatedAssignment)
  }

  async listSubmissions(
    groupId: string,
    assignmentId: string,
    userId: string,
    query: ListSubmissionsQueryDto,
  ): Promise<SubmissionDto[]> {
    const membership = await this.assertGroupAccess(groupId, userId)

    await this.assertAssignmentBelongsToGroup(this.prismaService, groupId, assignmentId)

    const canReviewAll = ASSIGNMENT_MANAGE_ROLES.has(membership.role) && query.mineOnly !== true
    const submissions = await this.prismaService.submission.findMany({
      where: {
        assignmentId,
        ...(canReviewAll
          ? {}
          : {
              authorId: userId,
            }),
      },
      select: submissionSelect,
      orderBy: [
        {
          authorId: 'asc',
        },
        {
          attemptNumber: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    })

    return Promise.all(submissions.map((submission) => this.mapSubmissionRecordToDto(submission)))
  }

  async createSubmission(
    groupId: string,
    assignmentId: string,
    userId: string,
    payload: CreateSubmissionRequestDto,
  ): Promise<SubmissionDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireWritable: true,
    })
    await this.assertAssignmentBelongsToGroup(this.prismaService, groupId, assignmentId)

    const status = payload.status ?? SubmissionStatus.DRAFT
    const fileIds = this.normalizeFileIds(payload.fileIds)

    await this.assertAttachableSubmissionFiles(fileIds, userId)

    let submission: SubmissionRecord

    try {
      submission = await this.prismaService.$transaction(async (tx) => {
        await this.lockSubmissionAttempts(tx, assignmentId, userId)

        const aggregate = await tx.submission.aggregate({
          where: {
            assignmentId,
            authorId: userId,
          },
          _max: {
            attemptNumber: true,
          },
        })
        const attemptNumber = (aggregate._max.attemptNumber ?? 0) + 1

        const createdSubmission = await tx.submission.create({
          data: {
            assignmentId,
            authorId: userId,
            attemptNumber,
            text: this.normalizeNullableText(payload.text),
            status,
            submittedAt: status === SubmissionStatus.SUBMITTED ? new Date() : null,
          },
          select: {
            id: true,
          },
        })

        await this.syncSubmissionFiles(tx, createdSubmission.id, fileIds)

        return this.getSubmissionRecordOrThrow(tx, assignmentId, createdSubmission.id)
      })
    } catch (error) {
      await this.rethrowSubmissionWriteConflict(error, assignmentId, userId, status)
      throw error
    }

    return this.mapSubmissionRecordToDto(submission)
  }

  private async lockSubmissionAttempts(
    executor: Prisma.TransactionClient,
    assignmentId: string,
    userId: string,
  ) {
    const lockKey = `submission-attempt:${assignmentId}:${userId}`

    await executor.$queryRaw(Prisma.sql`
      SELECT 1
      FROM (
        SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
      ) AS submission_attempt_lock
    `)
  }

  async getSubmission(
    groupId: string,
    assignmentId: string,
    submissionId: string,
    userId: string,
  ): Promise<SubmissionDto> {
    const membership = await this.assertGroupAccess(groupId, userId)

    await this.assertAssignmentBelongsToGroup(this.prismaService, groupId, assignmentId)

    const submission = await this.getSubmissionRecordOrThrow(
      this.prismaService,
      assignmentId,
      submissionId,
    )

    if (!ASSIGNMENT_MANAGE_ROLES.has(membership.role)) {
      this.authorizationService.assertOwnership(
        submission.authorId,
        userId,
        'You cannot access this submission',
      )
    }

    return this.mapSubmissionRecordToDto(submission)
  }

  async updateSubmission(
    groupId: string,
    assignmentId: string,
    submissionId: string,
    userId: string,
    payload: UpdateSubmissionRequestDto,
  ): Promise<SubmissionDto> {
    const membership = await this.assertGroupAccess(groupId, userId, {
      requireWritable: true,
    })

    await this.assertAssignmentBelongsToGroup(this.prismaService, groupId, assignmentId)

    const submission = await this.getSubmissionRecordOrThrow(this.prismaService, assignmentId, submissionId)
    const isAuthor = submission.authorId === userId
    const canReview = ASSIGNMENT_MANAGE_ROLES.has(membership.role)
    const contentPatchRequested =
      payload.text !== undefined ||
      payload.fileIds !== undefined ||
      (payload.status !== undefined && payload.status !== SubmissionStatus.REVIEWED)
    const reviewPatchRequested =
      payload.score !== undefined ||
      payload.feedback !== undefined ||
      payload.status === SubmissionStatus.REVIEWED
    const fileIds = payload.fileIds !== undefined ? this.normalizeFileIds(payload.fileIds) : undefined

    if (!canReview) {
      this.authorizationService.assertOwnership(
        submission.authorId,
        userId,
        'You cannot update this submission',
      )
    }

    if (contentPatchRequested) {
      this.authorizationService.assertOwnership(
        submission.authorId,
        userId,
        'You cannot edit this submission',
      )

      if (submission.status === SubmissionStatus.REVIEWED) {
        throw new ForbiddenException('Reviewed submissions are read-only')
      }
    }

    if (reviewPatchRequested) {
      if (!canReview) {
        throw new ForbiddenException('You cannot review this submission')
      }

      if (payload.status !== undefined && payload.status !== SubmissionStatus.REVIEWED) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: ['status: review updates must use REVIEWED status'],
        })
      }
    }

    if (contentPatchRequested && fileIds !== undefined) {
      await this.assertAttachableSubmissionFiles(fileIds, userId, submissionId)
    }

    const data: Prisma.SubmissionUpdateInput = {}

    if (contentPatchRequested) {
      const nextStatus = payload.status ?? submission.status

      if (payload.text !== undefined) {
        data.text = this.normalizeNullableText(payload.text)
      }

      if (payload.status !== undefined) {
        data.status = nextStatus
        data.submittedAt =
          nextStatus === SubmissionStatus.SUBMITTED ? submission.submittedAt ?? new Date() : null
      }
    }

    if (reviewPatchRequested) {
      data.status = SubmissionStatus.REVIEWED
      data.reviewedAt = new Date()
      data.reviewedByUser = {
        connect: {
          id: userId,
        },
      }

      if (payload.score !== undefined) {
        data.score = payload.score
      }

      if (payload.feedback !== undefined) {
        data.feedback = this.normalizeNullableText(payload.feedback)
      }
    }

    if (Object.keys(data).length === 0 && fileIds === undefined) {
      return this.mapSubmissionRecordToDto(submission)
    }

    const nextSubmissionStatus = (data.status as SubmissionStatus | undefined) ?? submission.status

    let updatedSubmission: SubmissionRecord

    try {
      updatedSubmission = await this.prismaService.$transaction(async (tx) => {
        if (Object.keys(data).length > 0) {
          await tx.submission.update({
            where: {
              id: submissionId,
            },
            data,
          })
        }

        if (contentPatchRequested && fileIds !== undefined) {
          await this.syncSubmissionFiles(tx, submissionId, fileIds)
        }

        return this.getSubmissionRecordOrThrow(tx, assignmentId, submissionId)
      })
    } catch (error) {
      await this.rethrowSubmissionWriteConflict(
        error,
        assignmentId,
        submission.authorId,
        nextSubmissionStatus,
      )
      throw error
    }

    return this.mapSubmissionRecordToDto(updatedSubmission)
  }

  private async assertGroupAccess(
    groupId: string,
    userId: string,
    options: {
      requireManage?: boolean
      requireWritable?: boolean
    } = {},
  ) {
    const context = await this.authorizationService.authorizeGroupAccess(groupId, userId, {
      requiredFeature: 'assignmentsEnabled',
      featureErrorMessage: 'Assignments module is disabled for this group',
      requiredRoles: options.requireManage ? [...ASSIGNMENT_MANAGE_ROLES] : undefined,
      roleErrorMessage: 'You cannot manage assignments in this group',
      requireWritable: options.requireWritable ?? false,
    })

    return context.membership!
  }

  private async assertLessonBelongsToGroup(groupId: string, lessonId: string) {
    const lesson = await this.prismaService.lesson.findFirst({
      where: {
        id: lessonId,
        groupId,
      },
      select: {
        id: true,
      },
    })

    if (!lesson) {
      throw new NotFoundException('Lesson not found')
    }
  }

  private async assertAssignmentBelongsToGroup(
    executor: PrismaExecutor,
    groupId: string,
    assignmentId: string,
  ) {
    const assignment = await executor.assignment.findFirst({
      where: {
        id: assignmentId,
        groupId,
      },
      select: {
        id: true,
      },
    })

    if (!assignment) {
      throw new NotFoundException('Assignment not found')
    }
  }

  private async getAssignmentRecordOrThrow(
    executor: PrismaExecutor,
    groupId: string,
    assignmentId: string,
  ): Promise<AssignmentRecord> {
    const assignment = await executor.assignment.findFirst({
      where: {
        id: assignmentId,
        groupId,
      },
      select: assignmentSelect,
    })

    if (!assignment) {
      throw new NotFoundException('Assignment not found')
    }

    return assignment
  }

  private async getSubmissionRecordOrThrow(
    executor: PrismaExecutor,
    assignmentId: string,
    submissionId: string,
  ): Promise<SubmissionRecord> {
    const submission = await executor.submission.findFirst({
      where: {
        id: submissionId,
        assignmentId,
      },
      select: submissionSelect,
    })

    if (!submission) {
      throw new NotFoundException('Submission not found')
    }

    return submission
  }

  private normalizeNullableText(value?: string) {
    if (value === undefined) {
      return undefined
    }

    return value.trim().length > 0 ? value : null
  }

  private normalizeFileIds(fileIds?: string[]) {
    if (!fileIds || fileIds.length === 0) {
      return []
    }

    const normalizedFileIds: string[] = []
    const seen = new Set<string>()

    for (const fileId of fileIds) {
      if (seen.has(fileId)) {
        continue
      }

      seen.add(fileId)
      normalizedFileIds.push(fileId)
    }

    return normalizedFileIds
  }

  private async assertAttachableFiles(fileIds: string[], groupId: string, assignmentId?: string) {
    if (fileIds.length === 0) {
      return
    }

    const files = await this.prismaService.file.findMany({
      where: {
        id: {
          in: fileIds,
        },
      },
      select: {
        id: true,
        uploadedByUserId: true,
        deletedAt: true,
      },
    })
    const filesById = new Map(files.map((file) => [file.id, file]))
    const managerUploaderIds = new Set(
      (
        await this.prismaService.groupMember.findMany({
          where: {
            groupId,
            userId: {
              in: [...new Set(files.map((file) => file.uploadedByUserId))],
            },
            role: {
              in: [...ASSIGNMENT_MANAGE_ROLES],
            },
          },
          select: {
            userId: true,
          },
        })
      ).map((membership) => membership.userId),
    )
    const alreadyAttachedFileIds =
      assignmentId === undefined
        ? new Set<string>()
        : new Set(
            (
              await this.prismaService.assignmentFile.findMany({
                where: {
                  assignmentId,
                  fileId: {
                    in: fileIds,
                  },
                },
                select: {
                  fileId: true,
                },
              })
            ).map((link) => link.fileId),
          )

    for (const fileId of fileIds) {
      const file = filesById.get(fileId)

      if (!file || file.deletedAt) {
        throw new NotFoundException('File not found')
      }

      if (!managerUploaderIds.has(file.uploadedByUserId) && !alreadyAttachedFileIds.has(fileId)) {
        throw new ForbiddenException('You cannot attach this file')
      }
    }
  }

  private async assertAttachableSubmissionFiles(
    fileIds: string[],
    userId: string,
    submissionId?: string,
  ) {
    if (fileIds.length === 0) {
      return
    }

    const files = await this.prismaService.file.findMany({
      where: {
        id: {
          in: fileIds,
        },
      },
      select: {
        id: true,
        uploadedByUserId: true,
        deletedAt: true,
      },
    })
    const filesById = new Map(files.map((file) => [file.id, file]))
    const alreadyAttachedFileIds =
      submissionId === undefined
        ? new Set<string>()
        : new Set(
            (
              await this.prismaService.submissionFile.findMany({
                where: {
                  submissionId,
                  fileId: {
                    in: fileIds,
                  },
                },
                select: {
                  fileId: true,
                },
              })
            ).map((link) => link.fileId),
          )

    for (const fileId of fileIds) {
      const file = filesById.get(fileId)

      if (!file || file.deletedAt) {
        throw new NotFoundException('File not found')
      }

      if (file.uploadedByUserId !== userId && !alreadyAttachedFileIds.has(fileId)) {
        throw new ForbiddenException('You cannot attach this file')
      }
    }
  }

  private resolveStatusMetadata(
    currentStatus: AssignmentStatus,
    currentPublishedAt: Date | null,
    currentArchivedAt: Date | null,
    nextStatus: AssignmentStatus,
  ) {
    if (nextStatus === currentStatus) {
      return {
        publishedAt: currentPublishedAt,
        archivedAt: currentArchivedAt,
      }
    }

    switch (nextStatus) {
      case AssignmentStatus.DRAFT:
        return {
          publishedAt: null,
          archivedAt: null,
        }
      case AssignmentStatus.PUBLISHED:
        return {
          publishedAt: currentPublishedAt ?? new Date(),
          archivedAt: null,
        }
      case AssignmentStatus.ARCHIVED:
        return {
          publishedAt: currentPublishedAt,
          archivedAt: currentArchivedAt ?? new Date(),
        }
    }
  }

  private async syncAssignmentFiles(
    executor: Prisma.TransactionClient,
    assignmentId: string,
    fileIds: string[],
  ) {
    if (fileIds.length === 0) {
      await executor.assignmentFile.deleteMany({
        where: {
          assignmentId,
        },
      })

      return
    }

    await executor.assignmentFile.deleteMany({
      where: {
        assignmentId,
        fileId: {
          notIn: fileIds,
        },
      },
    })

    for (const [index, fileId] of fileIds.entries()) {
      await executor.assignmentFile.upsert({
        where: {
          assignmentId_fileId: {
            assignmentId,
            fileId,
          },
        },
        update: {
          sortOrder: index + 1,
        },
        create: {
          assignmentId,
          fileId,
          sortOrder: index + 1,
        },
      })
    }
  }

  private async mapAssignmentRecordToDto(assignment: AssignmentRecord): Promise<AssignmentDto> {
    const fileUrls = await Promise.all(
      assignment.files.map((link) => this.minioService.getObjectUrl(link.file.storageKey)),
    )
    const fileUrlsById = new Map(
      assignment.files.map((link, index) => [link.file.id, fileUrls[index] ?? '']),
    )

    return mapAssignmentToDto(assignment, fileUrlsById)
  }

  private async syncSubmissionFiles(
    executor: Prisma.TransactionClient,
    submissionId: string,
    fileIds: string[],
  ) {
    if (fileIds.length === 0) {
      await executor.submissionFile.deleteMany({
        where: {
          submissionId,
        },
      })

      return
    }

    await executor.submissionFile.deleteMany({
      where: {
        submissionId,
        fileId: {
          notIn: fileIds,
        },
      },
    })

    for (const [index, fileId] of fileIds.entries()) {
      await executor.submissionFile.upsert({
        where: {
          submissionId_fileId: {
            submissionId,
            fileId,
          },
        },
        update: {
          sortOrder: index + 1,
        },
        create: {
          submissionId,
          fileId,
          sortOrder: index + 1,
        },
      })
    }
  }

  private async rethrowSubmissionWriteConflict(
    error: unknown,
    assignmentId: string,
    authorId: string,
    nextStatus: SubmissionStatus,
  ): Promise<never | void> {
    if (!this.isUniqueConstraintError(error)) {
      return
    }

    if (nextStatus === SubmissionStatus.DRAFT) {
      const existingDraft = await this.prismaService.submission.findFirst({
        where: {
          assignmentId,
          authorId,
          status: SubmissionStatus.DRAFT,
        },
        select: {
          id: true,
        },
      })

      if (existingDraft) {
        throw new ConflictException('You already have a draft submission for this assignment')
      }
    }

    throw new ConflictException('Failed to create a unique submission attempt. Retry the request.')
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
  }

  private async mapSubmissionRecordToDto(submission: SubmissionRecord): Promise<SubmissionDto> {
    const fileUrls = await Promise.all(
      submission.files.map((link) => this.minioService.getObjectUrl(link.file.storageKey)),
    )
    const fileUrlsById = new Map(
      submission.files.map((link, index) => [link.file.id, fileUrls[index] ?? '']),
    )
    const avatarUrlByFileId = await buildAvatarUrlByFileId(
      this.minioService,
      [submission.author, ...(submission.reviewedByUser ? [submission.reviewedByUser] : [])],
    )

    return mapSubmissionToDto(submission, fileUrlsById, avatarUrlByFileId)
  }
}
