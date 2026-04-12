import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { GroupAccessMode, GroupRole, GroupStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma/prisma.service'

export type GroupFeatureFlag =
  | 'chatEnabled'
  | 'lessonsEnabled'
  | 'assignmentsEnabled'
  | 'scheduleEnabled'

type GroupAuthorizationOptions = {
  allowDeleted?: boolean
  requireMembership?: boolean
  requireWritable?: boolean
  requiredRoles?: GroupRole[]
  requiredFeature?: GroupFeatureFlag | GroupFeatureFlag[]
  membershipErrorMessage?: string
  roleErrorMessage?: string
  featureErrorMessage?: string | Partial<Record<GroupFeatureFlag, string>>
}

type GroupFeatureState = Record<GroupFeatureFlag, boolean>

export type GroupAuthorizationContext = {
  group: {
    id: string
    ownerId: string
    accessMode: GroupAccessMode
    status: GroupStatus
    archivedAt: Date | null
  }
  membership: {
    role: GroupRole
  } | null
  settings: GroupFeatureState
}

const DEFAULT_FEATURE_ERROR_MESSAGES: Record<GroupFeatureFlag, string> = {
  chatEnabled: 'Chats module is disabled for this group',
  lessonsEnabled: 'Lessons module is disabled for this group',
  assignmentsEnabled: 'Assignments module is disabled for this group',
  scheduleEnabled: 'Schedule module is disabled for this group',
}

@Injectable()
export class AuthorizationService {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {}

  async authorizeGroupAccess(
    groupId: string,
    userId: string,
    options: GroupAuthorizationOptions = {},
  ): Promise<GroupAuthorizationContext> {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        ownerId: true,
        accessMode: true,
        status: true,
        archivedAt: true,
        settings: {
          select: {
            chatEnabled: true,
            lessonsEnabled: true,
            assignmentsEnabled: true,
            scheduleEnabled: true,
          },
        },
        members: {
          where: {
            userId,
          },
          select: {
            role: true,
          },
          take: 1,
        },
      },
    })

    if (!group || (!options.allowDeleted && group.status === GroupStatus.DELETED)) {
      throw new NotFoundException('Group not found')
    }

    if (!group.settings) {
      throw new NotFoundException('Group settings not found')
    }

    const membership = group.members[0] ?? null

    if ((options.requireMembership ?? true) && !membership) {
      throw new ForbiddenException(options.membershipErrorMessage ?? 'You are not a member of this group')
    }

    for (const feature of this.normalizeRequiredFeatures(options.requiredFeature)) {
      if (!group.settings[feature]) {
        throw new ForbiddenException(this.resolveFeatureErrorMessage(feature, options.featureErrorMessage))
      }
    }

    if (options.requiredRoles && options.requiredRoles.length > 0) {
      if (!membership || !options.requiredRoles.includes(membership.role)) {
        throw new ForbiddenException(options.roleErrorMessage ?? 'You do not have access to this resource')
      }
    }

    if (options.requireWritable && group.status === GroupStatus.ARCHIVED) {
      throw new ForbiddenException('Archived groups are read-only')
    }

    return {
      group: {
        id: group.id,
        ownerId: group.ownerId,
        accessMode: group.accessMode,
        status: group.status,
        archivedAt: group.archivedAt,
      },
      membership,
      settings: {
        chatEnabled: group.settings.chatEnabled,
        lessonsEnabled: group.settings.lessonsEnabled,
        assignmentsEnabled: group.settings.assignmentsEnabled,
        scheduleEnabled: group.settings.scheduleEnabled,
      },
    }
  }

  assertOwnership(ownerUserId: string, actorUserId: string, message: string) {
    if (ownerUserId !== actorUserId) {
      throw new ForbiddenException(message)
    }
  }

  private normalizeRequiredFeatures(requiredFeature?: GroupFeatureFlag | GroupFeatureFlag[]) {
    if (!requiredFeature) {
      return []
    }

    return Array.isArray(requiredFeature) ? requiredFeature : [requiredFeature]
  }

  private resolveFeatureErrorMessage(
    feature: GroupFeatureFlag,
    featureErrorMessage?: string | Partial<Record<GroupFeatureFlag, string>>,
  ) {
    if (typeof featureErrorMessage === 'string') {
      return featureErrorMessage
    }

    return featureErrorMessage?.[feature] ?? DEFAULT_FEATURE_ERROR_MESSAGES[feature]
  }
}
