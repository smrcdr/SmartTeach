import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AssignmentStatus, GroupRole, GroupStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { MinioService } from '../../storage/minio/minio.service'
import { AssignmentDto } from './dto/assignment.dto'
import { CreateAssignmentRequestDto } from './dto/create-assignment-request.dto'
import { ListAssignmentsQueryDto } from './dto/list-assignments-query.dto'
import { UpdateAssignmentRequestDto } from './dto/update-assignment-request.dto'
import { AssignmentRecord, assignmentSelect, mapAssignmentToDto } from './assignments.mapper'

const ASSIGNMENT_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])

type PrismaExecutor = Prisma.TransactionClient | PrismaService

@Injectable()
export class AssignmentsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
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

    if (payload.lessonId !== undefined) {
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
            lesson: {
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

  private async assertGroupAccess(
    groupId: string,
    userId: string,
    options: {
      requireManage?: boolean
      requireWritable?: boolean
    } = {},
  ) {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        status: true,
        settings: {
          select: {
            assignmentsEnabled: true,
          },
        },
      },
    })

    if (!group || group.status === GroupStatus.DELETED) {
      throw new NotFoundException('Group not found')
    }

    const membership = await this.prismaService.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      select: {
        role: true,
      },
    })

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group')
    }

    if (!group.settings) {
      throw new NotFoundException('Group settings not found')
    }

    if (!group.settings.assignmentsEnabled) {
      throw new ForbiddenException('Assignments module is disabled for this group')
    }

    if (options.requireManage && !ASSIGNMENT_MANAGE_ROLES.has(membership.role)) {
      throw new ForbiddenException('You cannot manage assignments in this group')
    }

    if (options.requireWritable && group.status === GroupStatus.ARCHIVED) {
      throw new ForbiddenException('Archived groups are read-only')
    }
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
}
