import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { GroupAccessMode, GroupRole, JoinRequestStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { AuthorizationService } from '../../security/authorization.service'
import { MinioService } from '../../storage/minio/minio.service'
import { buildAvatarUrlByFileId } from '../users/user-avatar.utils'
import { CreateGroupMemberRequestDto } from './dto/create-group-member-request.dto'
import { UpdateGroupMemberRequestDto } from './dto/update-group-member-request.dto'
import { GroupMemberDto } from './dto/group-member.dto'
import { GroupMemberRecord, groupMemberSelect, mapGroupMemberToDto } from './group-members.mapper'

const GROUP_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])

@Injectable()
export class GroupMembersService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(AuthorizationService)
    private readonly authorizationService: AuthorizationService,
    @Inject(MinioService)
    private readonly minioService: MinioService,
  ) {}

  async joinGroup(groupId: string, userId: string): Promise<GroupMemberDto> {
    const context = await this.authorizationService.authorizeGroupAccess(groupId, userId, {
      requireMembership: false,
      requireWritable: true,
    })
    const group = context.group

    if (group.accessMode !== GroupAccessMode.OPEN) {
      throw new ForbiddenException(
        group.accessMode === GroupAccessMode.BY_REQUEST
          ? 'Use join requests for this group'
          : 'Direct join is not allowed for this group',
      )
    }

    const member = await this.addMemberToGroup(groupId, userId, GroupRole.USER)

    return this.mapGroupMemberRecordToDto(member)
  }

  async leaveGroup(groupId: string, userId: string) {
    const context = await this.authorizationService.authorizeGroupAccess(groupId, userId, {
      requireWritable: true,
    })
    const membership = context.membership!

    if (membership.role === GroupRole.OWNER) {
      throw new ForbiddenException('Transfer ownership before leaving the group')
    }

    await this.prismaService.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    })
  }

  async listMembers(groupId: string, userId: string): Promise<GroupMemberDto[]> {
    await this.authorizationService.authorizeGroupAccess(groupId, userId)

    const members = await this.prismaService.groupMember.findMany({
      where: {
        groupId,
      },
      select: groupMemberSelect,
      orderBy: [
        {
          role: 'asc',
        },
        {
          joinedAt: 'asc',
        },
        {
          userId: 'asc',
        },
      ],
    })

    const avatarUrlByFileId = await buildAvatarUrlByFileId(
      this.minioService,
      members.map((member) => member.user),
    )

    return members.map((member) => mapGroupMemberToDto(member, avatarUrlByFileId))
  }

  async createMember(
    groupId: string,
    actorUserId: string,
    payload: CreateGroupMemberRequestDto,
  ): Promise<GroupMemberDto> {
    const context = await this.getManageContext(groupId, actorUserId, {
      requireWritable: true,
    })
    const role = payload.role ?? GroupRole.USER

    await this.requireUserExists(payload.userId)

    if (role === GroupRole.OWNER && context.actorRole !== GroupRole.OWNER) {
      throw new ForbiddenException('Only the current owner can transfer ownership')
    }

    const member = await this.addMemberToGroup(groupId, payload.userId, role, {
      transferOwnershipFromUserId:
        role === GroupRole.OWNER ? context.group.ownerId : undefined,
      reviewedByUserId: actorUserId,
    })

    return this.mapGroupMemberRecordToDto(member)
  }

  async updateMemberRole(
    groupId: string,
    targetUserId: string,
    actorUserId: string,
    payload: UpdateGroupMemberRequestDto,
  ): Promise<GroupMemberDto> {
    const context = await this.getManageContext(groupId, actorUserId, {
      requireWritable: true,
    })
    const targetMember = await this.getMemberOrThrow(groupId, targetUserId)

    if (targetMember.role === payload.role) {
      return this.mapGroupMemberRecordToDto(targetMember)
    }

    if (payload.role === GroupRole.OWNER) {
      if (context.actorRole !== GroupRole.OWNER) {
        throw new ForbiddenException('Only the current owner can transfer ownership')
      }

      if (targetUserId === context.group.ownerId) {
        return this.mapGroupMemberRecordToDto(targetMember)
      }

      const member = await this.prismaService.$transaction(async (tx) => {
        await tx.groupMember.update({
          where: {
            groupId_userId: {
              groupId,
              userId: context.group.ownerId,
            },
          },
          data: {
            role: GroupRole.ADMIN,
          },
        })

        await tx.group.update({
          where: {
            id: groupId,
          },
          data: {
            ownerId: targetUserId,
          },
        })

        return tx.groupMember.update({
          where: {
            groupId_userId: {
              groupId,
              userId: targetUserId,
            },
          },
          data: {
            role: GroupRole.OWNER,
          },
          select: groupMemberSelect,
        })
      })

      return this.mapGroupMemberRecordToDto(member)
    }

    if (targetUserId === context.group.ownerId) {
      throw new ForbiddenException('Transfer ownership before changing the owner role')
    }

    const member = await this.prismaService.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId,
        },
      },
      data: {
        role: payload.role,
      },
      select: groupMemberSelect,
    })

    return this.mapGroupMemberRecordToDto(member)
  }

  async removeMember(groupId: string, targetUserId: string, actorUserId: string) {
    const context = await this.getManageContext(groupId, actorUserId, {
      requireWritable: true,
    })
    const targetMember = await this.getMemberOrThrow(groupId, targetUserId)

    if (targetMember.userId === context.group.ownerId || targetMember.role === GroupRole.OWNER) {
      throw new ForbiddenException('Transfer ownership before removing the owner')
    }

    await this.prismaService.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId,
        },
      },
    })
  }

  private async getManageContext(
    groupId: string,
    actorUserId: string,
    options: {
      requireWritable?: boolean
    } = {},
  ) {
    const context = await this.authorizationService.authorizeGroupAccess(groupId, actorUserId, {
      requireWritable: options.requireWritable ?? false,
      requiredRoles: [...GROUP_MANAGE_ROLES],
      roleErrorMessage: 'You cannot manage this group',
    })
    const actorMembership = context.membership!

    return {
      group: context.group,
      actorRole: actorMembership.role,
    }
  }
  private async requireUserExists(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }
  }

  private async getMemberOrThrow(groupId: string, userId: string) {
    const member = await this.prismaService.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      select: groupMemberSelect,
    })

    if (!member) {
      throw new NotFoundException('Group member not found')
    }

    return member
  }

  private async addMemberToGroup(
    groupId: string,
    userId: string,
    role: GroupRole,
    options: {
      transferOwnershipFromUserId?: string
      reviewedByUserId?: string
    } = {},
  ) {
    return this.prismaService.$transaction(async (tx) => {
      const existingMembership = await tx.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
        select: {
          groupId: true,
        },
      })

      if (existingMembership) {
        throw new ConflictException('User is already a member of this group')
      }

      if (options.transferOwnershipFromUserId) {
        await tx.groupMember.update({
          where: {
            groupId_userId: {
              groupId,
              userId: options.transferOwnershipFromUserId,
            },
          },
          data: {
            role: GroupRole.ADMIN,
          },
        })

        await tx.group.update({
          where: {
            id: groupId,
          },
          data: {
            ownerId: userId,
          },
        })
      }

      const member = await tx.groupMember.create({
        data: {
          groupId,
          userId,
          role,
        },
        select: groupMemberSelect,
      })

      await this.approvePendingJoinRequests(tx, groupId, userId, options.reviewedByUserId)

      return member
    })
  }

  private async approvePendingJoinRequests(
    tx: Prisma.TransactionClient,
    groupId: string,
    userId: string,
    reviewedByUserId?: string,
  ) {
    const data: Prisma.GroupJoinRequestUpdateManyMutationInput = {
      status: JoinRequestStatus.APPROVED,
      reviewedAt: new Date(),
      ...(reviewedByUserId !== undefined
        ? {
            reviewedByUserId,
          }
        : {}),
    }

    await tx.groupJoinRequest.updateMany({
      where: {
        groupId,
        userId,
        status: JoinRequestStatus.PENDING,
      },
      data,
    })
  }

  private async mapGroupMemberRecordToDto(member: GroupMemberRecord) {
    const avatarUrlByFileId = await buildAvatarUrlByFileId(this.minioService, [member.user])

    return mapGroupMemberToDto(member, avatarUrlByFileId)
  }
}
