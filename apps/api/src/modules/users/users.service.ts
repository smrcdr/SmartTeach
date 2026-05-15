import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma/prisma.service'
import { UpdateMyProfileRequestDto } from './dto/update-my-profile-request.dto'
import { publicUserSelect, userSelect } from './users.mapper'

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {}

  async getCurrentUserOrThrow(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: userSelect,
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async getPublicUserOrThrow(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: publicUserSelect,
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async updateCurrentUser(userId: string, payload: UpdateMyProfileRequestDto) {
    if (payload.avatarFileId !== undefined && payload.avatarFileId !== null) {
      await this.assertAvatarFileIsAccessibleByUser(userId, payload.avatarFileId)
    }

    return this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(payload.displayName !== undefined
          ? {
              displayName: payload.displayName,
            }
          : {}),
        ...(payload.bio !== undefined
          ? {
              bio: payload.bio.length > 0 ? payload.bio : null,
            }
          : {}),
        ...(payload.avatarFileId !== undefined
          ? {
              avatarFileId: payload.avatarFileId,
            }
          : {}),
      },
      select: userSelect,
    })
  }

  private async assertAvatarFileIsAccessibleByUser(userId: string, fileId: string) {
    const file = await this.prismaService.file.findFirst({
      where: {
        id: fileId,
        uploadedByUserId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    })

    if (!file) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['avatarFileId: File not found'],
      })
    }
  }
}
