import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { GroupAccessMode, GroupRole, GroupStatus, JoinRequestStatus } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { GroupsService } from '../groups/groups.service'
import { GroupJoinRequestDto } from './dto/group-join-request.dto'
import { JoinRequestDecisionRequestDto } from './dto/join-request-decision-request.dto'
import { ListJoinRequestsQueryDto } from './dto/list-join-requests-query.dto'
import { groupJoinRequestSelect, mapGroupJoinRequestToDto } from './join-requests.mapper'

@Injectable()
export class JoinRequestsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(GroupsService) private readonly groupsService: GroupsService,
  ) {}

  async listJoinRequests(
    groupId: string,
    userId: string,
    query: ListJoinRequestsQueryDto,
  ): Promise<GroupJoinRequestDto[]> {
    await this.groupsService.assertCanManageGroup(groupId, userId)

    const requests = await this.prismaService.groupJoinRequest.findMany({
      where: {
        groupId,
        ...(query.status !== undefined
          ? {
              status: query.status,
            }
          : {}),
      },
      select: groupJoinRequestSelect,
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    })

    return requests.map(mapGroupJoinRequestToDto)
  }

  async createJoinRequest(groupId: string, userId: string): Promise<GroupJoinRequestDto> {
    const group = await this.getGroupOrThrow(groupId)

    if (group.accessMode === GroupAccessMode.OPEN) {
      throw new ForbiddenException('Use direct join for open groups')
    }

    if (group.accessMode === GroupAccessMode.CLOSED) {
      throw new ForbiddenException('You cannot request access to a closed group')
    }

    const membership = await this.prismaService.groupMember.findUnique({
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

    if (membership) {
      throw new ConflictException('User is already a member of this group')
    }

    const pendingRequest = await this.prismaService.groupJoinRequest.findFirst({
      where: {
        groupId,
        userId,
        status: JoinRequestStatus.PENDING,
      },
      select: {
        id: true,
      },
    })

    if (pendingRequest) {
      throw new ConflictException('You already have a pending join request for this group')
    }

    const request = await this.prismaService.groupJoinRequest.create({
      data: {
        groupId,
        userId,
      },
      select: groupJoinRequestSelect,
    })

    return mapGroupJoinRequestToDto(request)
  }

  async decideJoinRequest(
    groupId: string,
    requestId: string,
    actorUserId: string,
    payload: JoinRequestDecisionRequestDto,
  ): Promise<GroupJoinRequestDto> {
    await this.groupsService.assertCanManageGroup(groupId, actorUserId)

    const request = await this.prismaService.$transaction(async (tx) => {
      const existingRequest = await tx.groupJoinRequest.findFirst({
        where: {
          id: requestId,
          groupId,
        },
        select: {
          id: true,
          userId: true,
          status: true,
        },
      })

      if (!existingRequest) {
        throw new NotFoundException('Join request not found')
      }

      if (existingRequest.status !== JoinRequestStatus.PENDING) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: ['request: join request has already been reviewed'],
        })
      }

      if (payload.decision === 'APPROVED') {
        const membership = await tx.groupMember.findUnique({
          where: {
            groupId_userId: {
              groupId,
              userId: existingRequest.userId,
            },
          },
          select: {
            groupId: true,
          },
        })

        if (membership) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: ['request: user is already a group member'],
          })
        }

        await tx.groupMember.create({
          data: {
            groupId,
            userId: existingRequest.userId,
            role: GroupRole.USER,
          },
        })
      }

      return tx.groupJoinRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status:
            payload.decision === 'APPROVED'
              ? JoinRequestStatus.APPROVED
              : JoinRequestStatus.REJECTED,
          reviewedByUserId: actorUserId,
          reviewedAt: new Date(),
        },
        select: groupJoinRequestSelect,
      })
    })

    return mapGroupJoinRequestToDto(request)
  }

  private async getGroupOrThrow(groupId: string) {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        accessMode: true,
        status: true,
      },
    })

    if (!group || group.status === GroupStatus.DELETED) {
      throw new NotFoundException('Group not found')
    }

    return group
  }
}
