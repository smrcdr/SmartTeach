import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { GroupRole, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { AuthorizationService } from '../../security/authorization.service'
import { MinioService } from '../../storage/minio/minio.service'
import { CreateGroupUsefulLinkRequestDto } from './dto/create-group-useful-link-request.dto'
import { GroupUsefulLinkDto } from './dto/group-useful-link.dto'
import { UpdateGroupUsefulLinkRequestDto } from './dto/update-group-useful-link-request.dto'
import {
  GroupUsefulLinkRecord,
  groupUsefulLinkSelect,
  mapGroupUsefulLinkToDto,
} from './group-useful-links.mapper'

const USEFUL_LINK_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])

type PrismaExecutor = Prisma.TransactionClient | PrismaService

@Injectable()
export class GroupUsefulLinksService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(AuthorizationService)
    private readonly authorizationService: AuthorizationService,
    @Inject(MinioService) private readonly minioService: MinioService,
  ) {}

  async listUsefulLinks(groupId: string, userId: string): Promise<GroupUsefulLinkDto[]> {
    await this.assertGroupAccess(groupId, userId)

    const links = await this.prismaService.groupUsefulLink.findMany({
      where: {
        groupId,
      },
      select: groupUsefulLinkSelect,
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

    return Promise.all(links.map((link) => this.mapUsefulLinkRecordToDto(link)))
  }

  async createUsefulLink(
    groupId: string,
    userId: string,
    payload: CreateGroupUsefulLinkRequestDto,
  ): Promise<GroupUsefulLinkDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const imageFileId = payload.imageFileId ?? null

    await this.assertAttachableImage(imageFileId, userId)

    const link = await this.prismaService.$transaction(async (tx) => {
      const createdLink = await tx.groupUsefulLink.create({
        data: {
          groupId,
          title: payload.title,
          url: payload.url,
          imageFileId,
          sortOrder: payload.sortOrder ?? (await this.getNextSortOrder(tx, groupId)),
          createdByUserId: userId,
        },
        select: {
          id: true,
        },
      })

      return this.getUsefulLinkRecordOrThrow(tx, groupId, createdLink.id)
    })

    return this.mapUsefulLinkRecordToDto(link)
  }

  async updateUsefulLink(
    groupId: string,
    linkId: string,
    userId: string,
    payload: UpdateGroupUsefulLinkRequestDto,
  ): Promise<GroupUsefulLinkDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    await this.getUsefulLinkRecordOrThrow(this.prismaService, groupId, linkId)

    const link = await this.prismaService.groupUsefulLink.update({
      where: {
        id: linkId,
      },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.url !== undefined ? { url: payload.url } : {}),
      },
      select: groupUsefulLinkSelect,
    })

    return this.mapUsefulLinkRecordToDto(link)
  }

  async deleteUsefulLink(groupId: string, linkId: string, userId: string): Promise<void> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    await this.getUsefulLinkRecordOrThrow(this.prismaService, groupId, linkId)

    await this.prismaService.groupUsefulLink.delete({
      where: {
        id: linkId,
      },
    })
  }

  private async assertGroupAccess(
    groupId: string,
    userId: string,
    options: {
      requireManage?: boolean
      requireWritable?: boolean
    } = {},
  ) {
    await this.authorizationService.authorizeGroupAccess(groupId, userId, {
      requiredFeature: 'usefulLinksEnabled',
      featureErrorMessage: 'Useful links module is disabled for this group',
      requiredRoles: options.requireManage ? [...USEFUL_LINK_MANAGE_ROLES] : undefined,
      roleErrorMessage: 'You cannot manage useful links in this group',
      requireWritable: options.requireWritable ?? false,
    })
  }

  private async getUsefulLinkRecordOrThrow(
    executor: PrismaExecutor,
    groupId: string,
    linkId: string,
  ): Promise<GroupUsefulLinkRecord> {
    const usefulLink = await executor.groupUsefulLink.findFirst({
      where: {
        id: linkId,
        groupId,
      },
      select: groupUsefulLinkSelect,
    })

    if (!usefulLink) {
      throw new NotFoundException('Useful link not found')
    }

    return usefulLink
  }

  private async getNextSortOrder(executor: PrismaExecutor, groupId: string) {
    const aggregate = await executor.groupUsefulLink.aggregate({
      where: {
        groupId,
      },
      _max: {
        sortOrder: true,
      },
    })

    return (aggregate._max.sortOrder ?? 0) + 1
  }

  private async assertAttachableImage(imageFileId: string | null, userId: string) {
    if (!imageFileId) {
      return
    }

    const file = await this.prismaService.file.findUnique({
      where: {
        id: imageFileId,
      },
      select: {
        deletedAt: true,
        mimeType: true,
        uploadedByUserId: true,
      },
    })

    if (!file || file.deletedAt) {
      throw new NotFoundException('File not found')
    }

    if (!file.mimeType.startsWith('image/')) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['imageFileId: must reference an image file'],
      })
    }

    if (file.uploadedByUserId !== userId) {
      throw new ForbiddenException('You cannot attach this file')
    }
  }

  private async mapUsefulLinkRecordToDto(link: GroupUsefulLinkRecord): Promise<GroupUsefulLinkDto> {
    const imageUrl = link.imageFile
      ? await this.minioService.getObjectUrl(link.imageFile.storageKey)
      : null

    return mapGroupUsefulLinkToDto(link, imageUrl)
  }
}
