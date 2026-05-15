import {
  BadRequestException,
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
import { GroupJoinRequestDto } from './dto/group-join-request.dto'
import { JoinRequestDecisionRequestDto } from './dto/join-request-decision-request.dto'
import { ListJoinRequestsQueryDto } from './dto/list-join-requests-query.dto'
import {
  GroupJoinRequestRecord,
  groupJoinRequestSelect,
  mapGroupJoinRequestToDto,
} from './join-requests.mapper'

@Injectable()
export class JoinRequestsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(AuthorizationService)
    private readonly authorizationService: AuthorizationService,
    @Inject(MinioService)
    private readonly minioService: MinioService,
  ) {}

  async listJoinRequests(
    groupId: string,
    userId: string,
    query: ListJoinRequestsQueryDto,
  ): Promise<GroupJoinRequestDto[]> {
    await this.authorizationService.authorizeGroupAccess(groupId, userId, {
      requiredRoles: [GroupRole.OWNER, GroupRole.ADMIN],
      roleErrorMessage: 'You cannot manage this group',
    })

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

    const avatarUrlByFileId = await buildAvatarUrlByFileId(
      this.minioService,
      requests.flatMap((request) => [request.user, ...(request.reviewedByUser ? [request.reviewedByUser] : [])]),
    )

    return requests.map((request) => mapGroupJoinRequestToDto(request, avatarUrlByFileId))
  }

  async createJoinRequest(groupId: string, userId: string): Promise<GroupJoinRequestDto> {
    const context = await this.authorizationService.authorizeGroupAccess(groupId, userId, {
      requireMembership: false,
      requireWritable: true,
    })
    const group = context.group

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

    try {
      const request = await this.prismaService.groupJoinRequest.create({
        data: {
          groupId,
          userId,
        },
        select: groupJoinRequestSelect,
      })

      return this.mapJoinRequestRecordToDto(request)
    } catch (error) {
      this.rethrowCreateJoinRequestConflict(error)
      throw error
    }
  }

  async decideJoinRequest(
    groupId: string,
    requestId: string,
    actorUserId: string,
    payload: JoinRequestDecisionRequestDto,
  ): Promise<GroupJoinRequestDto> {
    await this.authorizationService.authorizeGroupAccess(groupId, actorUserId, {
      requiredRoles: [GroupRole.OWNER, GroupRole.ADMIN],
      requireWritable: true,
      roleErrorMessage: 'You cannot manage this group',
    })

    try {
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

      return this.mapJoinRequestRecordToDto(request)
    } catch (error) {
      this.rethrowJoinDecisionConflict(error)
      throw error
    }
  }

  private rethrowCreateJoinRequestConflict(error: unknown): never | void {
    if (this.isUniqueConstraintError(error)) {
      throw new ConflictException('You already have a pending join request for this group')
    }
  }

  private rethrowJoinDecisionConflict(error: unknown): never | void {
    if (this.isUniqueConstraintError(error)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['request: user is already a group member'],
      })
    }
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
  }

  private async mapJoinRequestRecordToDto(request: GroupJoinRequestRecord) {
    const avatarUrlByFileId = await buildAvatarUrlByFileId(
      this.minioService,
      [request.user, ...(request.reviewedByUser ? [request.reviewedByUser] : [])],
    )

    return mapGroupJoinRequestToDto(request, avatarUrlByFileId)
  }
}
