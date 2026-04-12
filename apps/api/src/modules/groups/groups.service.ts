import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { GroupRole, GroupStatus, Prisma } from '@prisma/client'
import { CodeGeneratorService } from '../../common/code-generator.service'
import { PrismaService } from '../../database/prisma/prisma.service'
import { CreateGroupRequestDto } from './dto/create-group-request.dto'
import { ListGroupsQueryDto } from './dto/list-groups-query.dto'
import { UpdateGroupRequestDto } from './dto/update-group-request.dto'
import { GroupDto } from './dto/group.dto'
import { GroupSettingsDto } from './dto/group-settings.dto'
import { mapGroupToDto, mapGroupSettingsToDto, groupSelect, groupSettingsSelect } from './groups.mapper'

const PUBLIC_GROUP_ACCESS_MODES = ['OPEN', 'BY_REQUEST'] as const
const GROUP_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])

@Injectable()
export class GroupsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(CodeGeneratorService)
    private readonly codeGeneratorService: CodeGeneratorService,
  ) {}

  async listGroups(userId: string, query: ListGroupsQueryDto) {
    const groups = await this.prismaService.group.findMany({
      where: {
        AND: [
          query.joinedOnly ? this.buildJoinedOnlyWhere(userId) : this.buildVisibleWhere(userId),
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

    return groups.map(mapGroupToDto)
  }

  async createGroup(ownerId: string, payload: CreateGroupRequestDto): Promise<GroupDto> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        const group = await this.prismaService.$transaction((tx) =>
          tx.group.create({
            data: {
              code: this.codeGeneratorService.generateGroupCode(),
              name: payload.name,
              description: this.normalizeDescription(payload.description),
              ownerId,
              accessMode: payload.accessMode,
              settings: {
                create: {
                  chatEnabled: payload.settings.chatEnabled,
                  lessonsEnabled: payload.settings.lessonsEnabled,
                  assignmentsEnabled: payload.settings.assignmentsEnabled,
                  scheduleEnabled: payload.settings.scheduleEnabled,
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

        return mapGroupToDto(group)
      } catch (error) {
        if (this.isGroupCodeConflict(error)) {
          continue
        }

        throw error
      }
    }

    throw new ConflictException('Failed to generate a unique group code')
  }

  async getGroupByCodeOrThrow(userId: string, code: string) {
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

    return mapGroupToDto(group)
  }

  async getGroupByIdOrThrow(userId: string, groupId: string) {
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

    return mapGroupToDto(group)
  }

  async updateGroup(groupId: string, userId: string, payload: UpdateGroupRequestDto) {
    if ((payload as { status?: string }).status === GroupStatus.DELETED) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['status: DELETED is not allowed in this endpoint'],
      })
    }

    const group = await this.assertCanManageGroup(groupId, userId)

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

    const updatedGroup = await this.prismaService.group.update({
      where: {
        id: groupId,
      },
      data,
      select: groupSelect,
    })

    return mapGroupToDto(updatedGroup)
  }

  async deleteGroup(groupId: string, userId: string) {
    await this.assertCanManageGroup(groupId, userId)

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
    await this.assertGroupMember(groupId, userId, {
      allowDeleted: true,
    })

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
    await this.assertCanManageGroup(groupId, userId)

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
    await this.ensureGroupExists(groupId, {
      allowDeleted: options.allowDeleted ?? false,
    })

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

    return membership
  }

  async assertCanManageGroup(groupId: string, userId: string) {
    const group = await this.ensureGroupExists(groupId)
    const membership = await this.assertGroupMember(groupId, userId)

    if (!GROUP_MANAGE_ROLES.has(membership.role)) {
      throw new ForbiddenException('You cannot manage this group')
    }

    return group
  }

  private async ensureGroupExists(
    groupId: string,
    options: {
      allowDeleted?: boolean
    } = {},
  ) {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        status: true,
        archivedAt: true,
      },
    })

    if (!group || (!options.allowDeleted && group.status === GroupStatus.DELETED)) {
      throw new NotFoundException('Group not found')
    }

    return group
  }

  private buildVisibleWhere(userId: string): Prisma.GroupWhereInput {
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
      members: {
        some: {
          userId,
        },
      },
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
}
