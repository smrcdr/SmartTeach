import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { GroupRole, GroupStatus, JoinRequestStatus, Prisma } from '@prisma/client'
import { CodeGeneratorService } from '../../common/code-generator.service'
import { PrismaService } from '../../database/prisma/prisma.service'
import { AuthorizationService } from '../../security/authorization.service'
import { MinioService } from '../../storage/minio/minio.service'
import { CreateGroupRequestDto } from './dto/create-group-request.dto'
import { ListGroupsQueryDto } from './dto/list-groups-query.dto'
import { UpdateGroupRequestDto } from './dto/update-group-request.dto'
import { GroupDto } from './dto/group.dto'
import { GroupSettingsDto } from './dto/group-settings.dto'
import {
  buildGroupSelect,
  buildGroupImageUrlByFileId,
  mapGroupToDto,
  mapGroupSettingsToDto,
  groupSettingsSelect,
} from './groups.mapper'
import { buildAvatarUrlByFileId } from '../users/user-avatar.utils'

const PUBLIC_GROUP_ACCESS_MODES = ['OPEN', 'BY_REQUEST'] as const
const GROUP_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])

@Injectable()
export class GroupsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(AuthorizationService)
    private readonly authorizationService: AuthorizationService,
    @Inject(CodeGeneratorService)
    private readonly codeGeneratorService: CodeGeneratorService,
    @Inject(MinioService)
    private readonly minioService: MinioService,
  ) {}

  async listGroups(userId: string | null, query: ListGroupsQueryDto) {
    let visibilityWhere: Prisma.GroupWhereInput

    if (query.joinedOnly) {
      if (!userId) {
        throw new UnauthorizedException()
      }

      visibilityWhere = this.buildJoinedOnlyWhere(userId)
    } else {
      visibilityWhere = this.buildVisibleWhere(userId)
    }

    const groupSelect = buildGroupSelect(userId)
    const groups = await this.prismaService.group.findMany({
      where: {
        AND: [
          visibilityWhere,
          ...(query.search
            ? [
                {
                  OR: [
                    {
                      name: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      description: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                  ],
                } satisfies Prisma.GroupWhereInput,
              ]
            : []),
          ...(query.code
            ? [
                {
                  code: {
                    contains: query.code,
                    mode: 'insensitive',
                  },
                } satisfies Prisma.GroupWhereInput,
              ]
            : []),
          ...(query.accessMode
            ? [
                {
                  accessMode: query.accessMode,
                } satisfies Prisma.GroupWhereInput,
              ]
            : []),
          ...(query.status
            ? [
                {
                  status: query.status,
                } satisfies Prisma.GroupWhereInput,
              ]
            : []),
        ],
      },
      select: groupSelect,
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    })

    const avatarUrlByFileId = await buildAvatarUrlByFileId(
      this.minioService,
      groups.map((group) => group.owner),
    )
    const groupImageUrlByFileId = await buildGroupImageUrlByFileId(this.minioService, groups)

    return groups.map((group) => mapGroupToDto(group, avatarUrlByFileId, groupImageUrlByFileId))
  }

  async createGroup(ownerId: string, payload: CreateGroupRequestDto): Promise<GroupDto> {
    const groupSelect = buildGroupSelect(ownerId)
    await this.assertGroupImageFileIsAccessibleByUser(ownerId, payload.avatarFileId, 'avatarFileId')
    await this.assertGroupImageFileIsAccessibleByUser(ownerId, payload.catalogImageFileId, 'catalogImageFileId')

    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        const group = await this.prismaService.$transaction((tx) =>
          tx.group.create({
            data: {
              code: this.codeGeneratorService.generateGroupCode(),
              name: payload.name,
              description: this.normalizeDescription(payload.description),
              avatarFileId: payload.avatarFileId ?? null,
              catalogImageFileId: payload.catalogImageFileId ?? null,
              ownerId,
              accessMode: payload.accessMode,
              settings: {
                create: {
                  chatEnabled: payload.settings.chatEnabled,
                  lessonsEnabled: payload.settings.lessonsEnabled,
                  assignmentsEnabled: payload.settings.assignmentsEnabled,
                  scheduleEnabled: payload.settings.scheduleEnabled,
                  scheduleWeeklyEnabled: payload.settings.scheduleWeeklyEnabled ?? true,
                  scheduleSpecialEnabled: payload.settings.scheduleSpecialEnabled ?? true,
                  usefulLinksEnabled: payload.settings.usefulLinksEnabled,
                },
              },
              members: {
                create: {
                  userId: ownerId,
                  role: GroupRole.OWNER,
                },
              },
            },
            select: groupSelect,
          }),
        )

        return this.mapGroupRecordToDto(group)
      } catch (error) {
        if (this.isGroupCodeConflict(error)) {
          continue
        }

        throw error
      }
    }

    throw new ConflictException('Failed to generate a unique group code')
  }

  async getGroupByCodeOrThrow(userId: string | null, code: string) {
    const groupSelect = buildGroupSelect(userId)
    const group = await this.prismaService.group.findFirst({
      where: {
        AND: [
          this.buildVisibleWhere(userId),
          {
            code: {
              equals: code.trim().toUpperCase(),
              mode: 'insensitive',
            },
          },
        ],
      },
      select: groupSelect,
    })

    if (!group) {
      throw new NotFoundException('Group not found')
    }

    return this.mapGroupRecordToDto(group)
  }

  async getGroupByIdOrThrow(userId: string | null, groupId: string) {
    const groupSelect = buildGroupSelect(userId)
    const group = await this.prismaService.group.findFirst({
      where: {
        AND: [
          this.buildVisibleWhere(userId),
          {
            id: groupId,
          },
        ],
      },
      select: groupSelect,
    })

    if (!group) {
      throw new NotFoundException('Group not found')
    }

    return this.mapGroupRecordToDto(group)
  }

  async updateGroup(groupId: string, userId: string, payload: UpdateGroupRequestDto) {
    if ((payload as { status?: string }).status === GroupStatus.DELETED) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['status: DELETED is not allowed in this endpoint'],
      })
    }

    const group = await this.assertCanManageGroup(groupId, userId)
    await this.assertGroupImageFileIsAccessibleByUser(userId, payload.avatarFileId, 'avatarFileId')
    await this.assertGroupImageFileIsAccessibleByUser(userId, payload.catalogImageFileId, 'catalogImageFileId')
    const shouldRejectPendingJoinRequests =
      payload.accessMode !== undefined &&
      payload.accessMode !== group.accessMode &&
      payload.accessMode !== 'BY_REQUEST'

    const data: Prisma.GroupUpdateInput = {
      ...(payload.name !== undefined
        ? {
            name: payload.name,
          }
        : {}),
      ...(payload.description !== undefined
        ? {
            description: this.normalizeDescription(payload.description),
          }
        : {}),
      ...(payload.avatarFileId !== undefined
        ? {
            avatarFileId: payload.avatarFileId,
          }
        : {}),
      ...(payload.catalogImageFileId !== undefined
        ? {
            catalogImageFileId: payload.catalogImageFileId,
          }
        : {}),
      ...(payload.accessMode !== undefined
        ? {
            accessMode: payload.accessMode,
          }
        : {}),
      ...(payload.status !== undefined
        ? {
            status: payload.status,
            archivedAt: this.resolveArchivedAt(group.archivedAt, group.status, payload.status),
          }
        : {}),
    }

    if (Object.keys(data).length === 0) {
      return this.getGroupByIdOrThrow(userId, groupId)
    }

    const groupSelect = buildGroupSelect(userId)
    const updatedGroup = await this.prismaService.$transaction(async (tx) => {
      const nextGroup = await tx.group.update({
        where: {
          id: groupId,
        },
        data,
        select: groupSelect,
      })

      if (shouldRejectPendingJoinRequests) {
        await tx.groupJoinRequest.updateMany({
          where: {
            groupId,
            status: JoinRequestStatus.PENDING,
          },
          data: {
            status: JoinRequestStatus.REJECTED,
            reviewedAt: new Date(),
            reviewedByUserId: userId,
          },
        })
      }

      return nextGroup
    })

    return this.mapGroupRecordToDto(updatedGroup)
  }

  async deleteGroup(groupId: string, userId: string) {
    const group = await this.assertCanManageGroup(groupId, userId)

    this.authorizationService.assertOwnership(
      group.ownerId,
      userId,
      'Only the group owner can delete this group',
    )

    await this.prismaService.group.update({
      where: {
        id: groupId,
      },
      data: {
        status: GroupStatus.DELETED,
        deletedAt: new Date(),
      },
    })
  }

  async getGroupSettingsOrThrow(groupId: string, userId: string): Promise<GroupSettingsDto> {
    await this.assertGroupMember(groupId, userId)

    const settings = await this.prismaService.groupSettings.findUnique({
      where: {
        groupId,
      },
      select: groupSettingsSelect,
    })

    if (!settings) {
      throw new NotFoundException('Group settings not found')
    }

    return mapGroupSettingsToDto(settings)
  }

  async updateGroupSettings(
    groupId: string,
    userId: string,
    payload: Partial<GroupSettingsDto>,
  ): Promise<GroupSettingsDto> {
    await this.assertCanManageGroup(groupId, userId, {
      requireWritable: true,
    })

    const data: Prisma.GroupSettingsUpdateInput = {
      ...(payload.chatEnabled !== undefined
        ? {
            chatEnabled: payload.chatEnabled,
          }
        : {}),
      ...(payload.lessonsEnabled !== undefined
        ? {
            lessonsEnabled: payload.lessonsEnabled,
          }
        : {}),
      ...(payload.assignmentsEnabled !== undefined
        ? {
            assignmentsEnabled: payload.assignmentsEnabled,
          }
        : {}),
      ...(payload.scheduleEnabled !== undefined
        ? {
            scheduleEnabled: payload.scheduleEnabled,
          }
        : {}),
      ...(payload.scheduleWeeklyEnabled !== undefined
        ? {
            scheduleWeeklyEnabled: payload.scheduleWeeklyEnabled,
          }
        : {}),
      ...(payload.scheduleSpecialEnabled !== undefined
        ? {
            scheduleSpecialEnabled: payload.scheduleSpecialEnabled,
          }
        : {}),
      ...(payload.usefulLinksEnabled !== undefined
        ? {
            usefulLinksEnabled: payload.usefulLinksEnabled,
          }
        : {}),
    }

    if (Object.keys(data).length === 0) {
      return this.getGroupSettingsOrThrow(groupId, userId)
    }

    const settings = await this.prismaService.groupSettings.update({
      where: {
        groupId,
      },
      data,
      select: groupSettingsSelect,
    })

    return mapGroupSettingsToDto(settings)
  }

  async assertGroupMember(
    groupId: string,
    userId: string,
    options: {
      allowDeleted?: boolean
    } = {},
  ) {
    const context = await this.authorizationService.authorizeGroupAccess(groupId, userId, {
      allowDeleted: options.allowDeleted ?? false,
    })
    const membership = context.membership

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group')
    }

    return membership
  }

  async assertCanManageGroup(
    groupId: string,
    userId: string,
    options: {
      requireWritable?: boolean
    } = {},
  ) {
    const context = await this.authorizationService.authorizeGroupAccess(groupId, userId, {
      requiredRoles: [...GROUP_MANAGE_ROLES],
      requireWritable: options.requireWritable ?? false,
      roleErrorMessage: 'You cannot manage this group',
    })

    return context.group
  }

  private buildVisibleWhere(userId: string | null): Prisma.GroupWhereInput {
    if (!userId) {
      return {
        status: GroupStatus.ACTIVE,
        accessMode: {
          in: [...PUBLIC_GROUP_ACCESS_MODES],
        },
      }
    }

    return {
      OR: [
        this.buildJoinedOnlyWhere(userId),
        {
          status: GroupStatus.ACTIVE,
          accessMode: {
            in: [...PUBLIC_GROUP_ACCESS_MODES],
          },
        },
      ],
    }
  }

  private buildJoinedOnlyWhere(userId: string): Prisma.GroupWhereInput {
    return {
      AND: [
        {
          status: {
            not: GroupStatus.DELETED,
          },
        },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    }
  }

  private normalizeDescription(description?: string) {
    if (description === undefined) {
      return undefined
    }

    return description.length > 0 ? description : null
  }

  private resolveArchivedAt(
    currentArchivedAt: Date | null,
    currentStatus: GroupStatus,
    nextStatus: 'ACTIVE' | 'ARCHIVED',
  ) {
    if (nextStatus === 'ARCHIVED') {
      return currentStatus === GroupStatus.ARCHIVED ? currentArchivedAt : new Date()
    }

    return null
  }

  private isGroupCodeConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes('code')
    )
  }

  private async mapGroupRecordToDto(
    group: Prisma.GroupGetPayload<{ select: ReturnType<typeof buildGroupSelect> }>,
  ) {
    const avatarUrlByFileId = await buildAvatarUrlByFileId(this.minioService, [group.owner])
    const groupImageUrlByFileId = await buildGroupImageUrlByFileId(this.minioService, [group])

    return mapGroupToDto(group, avatarUrlByFileId, groupImageUrlByFileId)
  }

  private async assertGroupImageFileIsAccessibleByUser(
    userId: string,
    fileId: string | null | undefined,
    fieldName: 'avatarFileId' | 'catalogImageFileId',
  ) {
    if (fileId === undefined || fileId === null) {
      return
    }

    const file = await this.prismaService.file.findFirst({
      where: {
        id: fileId,
        uploadedByUserId: userId,
        deletedAt: null,
        mimeType: {
          startsWith: 'image/',
        },
      },
      select: {
        id: true,
      },
    })

    if (!file) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [`${fieldName}: Image file not found`],
      })
    }
  }
}
