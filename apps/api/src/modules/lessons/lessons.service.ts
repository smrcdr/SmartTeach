import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { GroupRole, GroupStatus, LessonStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { MinioService } from '../../storage/minio/minio.service'
import { CreateLessonRequestDto } from './dto/create-lesson-request.dto'
import { LessonDto } from './dto/lesson.dto'
import { ListLessonsQueryDto } from './dto/list-lessons-query.dto'
import { UpdateLessonRequestDto } from './dto/update-lesson-request.dto'
import { LessonRecord, lessonSelect, mapLessonToDto } from './lessons.mapper'

const LESSON_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])

type PrismaExecutor = Prisma.TransactionClient | PrismaService

@Injectable()
export class LessonsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(MinioService) private readonly minioService: MinioService,
  ) {}

  async listLessons(
    groupId: string,
    userId: string,
    query: ListLessonsQueryDto,
  ): Promise<LessonDto[]> {
    await this.assertGroupAccess(groupId, userId)

    const lessons = await this.prismaService.lesson.findMany({
      where: {
        groupId,
        ...(query.status !== undefined
          ? {
              status: query.status,
            }
          : {}),
      },
      select: lessonSelect,
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    })

    return Promise.all(lessons.map((lesson) => this.mapLessonRecordToDto(lesson)))
  }

  async createLesson(
    groupId: string,
    userId: string,
    payload: CreateLessonRequestDto,
  ): Promise<LessonDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const dates = this.resolveDateRange({
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
    })
    const status = payload.status ?? LessonStatus.DRAFT
    const fileIds = this.normalizeFileIds(payload.fileIds)

    await this.assertAttachableFiles(fileIds, userId)

    const lesson = await this.prismaService.$transaction(async (tx) => {
      const createdLesson = await tx.lesson.create({
        data: {
          groupId,
          title: payload.title,
          content: this.normalizeNullableText(payload.content),
          status,
          sortOrder: payload.sortOrder ?? (await this.getNextSortOrder(tx, groupId)),
          startsAt: dates.startsAt,
          endsAt: dates.endsAt,
          publishedAt: status === LessonStatus.PUBLISHED ? new Date() : null,
          archivedAt: status === LessonStatus.ARCHIVED ? new Date() : null,
          createdByUserId: userId,
        },
        select: {
          id: true,
        },
      })

      await this.syncLessonFiles(tx, createdLesson.id, fileIds)

      return this.getLessonRecordOrThrow(tx, groupId, createdLesson.id)
    })

    return this.mapLessonRecordToDto(lesson)
  }

  async getLesson(groupId: string, lessonId: string, userId: string): Promise<LessonDto> {
    await this.assertGroupAccess(groupId, userId)

    const lesson = await this.getLessonRecordOrThrow(this.prismaService, groupId, lessonId)

    return this.mapLessonRecordToDto(lesson)
  }

  async updateLesson(
    groupId: string,
    lessonId: string,
    userId: string,
    payload: UpdateLessonRequestDto,
  ): Promise<LessonDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const existingLesson = await this.getLessonRecordOrThrow(this.prismaService, groupId, lessonId)
    const fileIds = payload.fileIds !== undefined ? this.normalizeFileIds(payload.fileIds) : undefined

    if (fileIds !== undefined) {
      await this.assertAttachableFiles(fileIds, userId)
    }

    const dates = this.resolveDateRange({
      startsAt: payload.startsAt ?? (existingLesson.startsAt?.toISOString() ?? null),
      endsAt: payload.endsAt ?? (existingLesson.endsAt?.toISOString() ?? null),
    })
    const nextStatus = payload.status ?? existingLesson.status
    const statusMetadata = this.resolveStatusMetadata(
      existingLesson.status,
      existingLesson.publishedAt,
      existingLesson.archivedAt,
      nextStatus,
    )
    const data: Prisma.LessonUpdateInput = {
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
      ...(payload.sortOrder !== undefined
        ? {
            sortOrder: payload.sortOrder,
          }
        : {}),
      ...(payload.startsAt !== undefined
        ? {
            startsAt: dates.startsAt,
          }
        : {}),
      ...(payload.endsAt !== undefined
        ? {
            endsAt: dates.endsAt,
          }
        : {}),
    }

    if (Object.keys(data).length === 0 && fileIds === undefined) {
      return this.mapLessonRecordToDto(existingLesson)
    }

    const updatedLesson = await this.prismaService.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.lesson.update({
          where: {
            id: lessonId,
          },
          data,
        })
      }

      if (fileIds !== undefined) {
        await this.syncLessonFiles(tx, lessonId, fileIds)
      }

      return this.getLessonRecordOrThrow(tx, groupId, lessonId)
    })

    return this.mapLessonRecordToDto(updatedLesson)
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
            lessonsEnabled: true,
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

    if (!group.settings.lessonsEnabled) {
      throw new ForbiddenException('Lessons module is disabled for this group')
    }

    if (options.requireManage && !LESSON_MANAGE_ROLES.has(membership.role)) {
      throw new ForbiddenException('You cannot manage lessons in this group')
    }

    if (options.requireWritable && group.status === GroupStatus.ARCHIVED) {
      throw new ForbiddenException('Archived groups are read-only')
    }
  }

  private async getLessonRecordOrThrow(
    executor: PrismaExecutor,
    groupId: string,
    lessonId: string,
  ): Promise<LessonRecord> {
    const lesson = await executor.lesson.findFirst({
      where: {
        id: lessonId,
        groupId,
      },
      select: lessonSelect,
    })

    if (!lesson) {
      throw new NotFoundException('Lesson not found')
    }

    return lesson
  }

  private async getNextSortOrder(executor: PrismaExecutor, groupId: string) {
    const aggregate = await executor.lesson.aggregate({
      where: {
        groupId,
      },
      _max: {
        sortOrder: true,
      },
    })

    return (aggregate._max.sortOrder ?? 0) + 1
  }

  private resolveDateRange(params: {
    startsAt?: string | null
    endsAt?: string | null
  }) {
    const startsAt = params.startsAt ? new Date(params.startsAt) : null
    const endsAt = params.endsAt ? new Date(params.endsAt) : null

    if (startsAt && endsAt && startsAt.getTime() > endsAt.getTime()) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['endsAt: must be greater than or equal to startsAt'],
      })
    }

    return {
      startsAt,
      endsAt,
    }
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

  private async assertAttachableFiles(fileIds: string[], userId: string) {
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

    for (const fileId of fileIds) {
      const file = filesById.get(fileId)

      if (!file || file.deletedAt) {
        throw new NotFoundException('File not found')
      }

      if (file.uploadedByUserId !== userId) {
        throw new ForbiddenException('You cannot attach this file')
      }
    }
  }

  private resolveStatusMetadata(
    currentStatus: LessonStatus,
    currentPublishedAt: Date | null,
    currentArchivedAt: Date | null,
    nextStatus: LessonStatus,
  ) {
    if (nextStatus === currentStatus) {
      return {
        publishedAt: currentPublishedAt,
        archivedAt: currentArchivedAt,
      }
    }

    switch (nextStatus) {
      case LessonStatus.DRAFT:
        return {
          publishedAt: null,
          archivedAt: null,
        }
      case LessonStatus.PUBLISHED:
        return {
          publishedAt: currentPublishedAt ?? new Date(),
          archivedAt: null,
        }
      case LessonStatus.ARCHIVED:
        return {
          publishedAt: currentPublishedAt,
          archivedAt: currentArchivedAt ?? new Date(),
        }
    }
  }

  private async syncLessonFiles(
    executor: Prisma.TransactionClient,
    lessonId: string,
    fileIds: string[],
  ) {
    if (fileIds.length === 0) {
      await executor.lessonFile.deleteMany({
        where: {
          lessonId,
        },
      })

      return
    }

    await executor.lessonFile.deleteMany({
      where: {
        lessonId,
        fileId: {
          notIn: fileIds,
        },
      },
    })

    for (const [index, fileId] of fileIds.entries()) {
      await executor.lessonFile.upsert({
        where: {
          lessonId_fileId: {
            lessonId,
            fileId,
          },
        },
        update: {
          sortOrder: index + 1,
        },
        create: {
          lessonId,
          fileId,
          sortOrder: index + 1,
        },
      })
    }
  }

  private async mapLessonRecordToDto(lesson: LessonRecord): Promise<LessonDto> {
    const fileUrls = await Promise.all(
      lesson.files.map((link) => this.minioService.getObjectUrl(link.file.storageKey)),
    )
    const fileUrlsById = new Map(
      lesson.files.map((link, index) => [link.file.id, fileUrls[index] ?? '']),
    )

    return mapLessonToDto(lesson, fileUrlsById)
  }
}
