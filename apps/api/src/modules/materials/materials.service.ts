import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { GroupRole, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { AuthorizationService } from '../../security/authorization.service'
import { CreateMaterialSectionRequestDto } from './dto/create-material-section-request.dto'
import { CreateMaterialSubsectionRequestDto } from './dto/create-material-subsection-request.dto'
import { MaterialSectionDto } from './dto/material-section.dto'
import { MaterialSubsectionDetailsDto } from './dto/material-subsection-details.dto'
import { UpdateMaterialSectionRequestDto } from './dto/update-material-section-request.dto'
import { UpdateMaterialSubsectionRequestDto } from './dto/update-material-subsection-request.dto'
import {
  MaterialSectionRecord,
  MaterialSubsectionDetailsRecord,
  mapMaterialSectionToDto,
  mapMaterialSubsectionDetailsToDto,
  materialSectionSelect,
  materialSubsectionDetailsSelect,
} from './materials.mapper'

const MATERIAL_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])

type PrismaExecutor = Prisma.TransactionClient | PrismaService

@Injectable()
export class MaterialsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(AuthorizationService)
    private readonly authorizationService: AuthorizationService,
  ) {}

  async listMaterials(groupId: string, userId: string): Promise<MaterialSectionDto[]> {
    await this.assertGroupAccess(groupId, userId)

    const sections = await this.prismaService.materialSection.findMany({
      where: {
        groupId,
      },
      select: materialSectionSelect,
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

    return sections.map((section) => mapMaterialSectionToDto(section))
  }

  async createSection(
    groupId: string,
    userId: string,
    payload: CreateMaterialSectionRequestDto,
  ): Promise<MaterialSectionDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const section = await this.prismaService.$transaction(async (tx) => {
      const createdSection = await tx.materialSection.create({
        data: {
          groupId,
          title: payload.title,
          sortOrder: payload.sortOrder ?? (await this.getNextSectionSortOrder(tx, groupId)),
          createdByUserId: userId,
        },
        select: {
          id: true,
        },
      })

      return this.getSectionRecordOrThrow(tx, groupId, createdSection.id)
    })

    return mapMaterialSectionToDto(section)
  }

  async createSubsection(
    groupId: string,
    sectionId: string,
    userId: string,
    payload: CreateMaterialSubsectionRequestDto,
  ): Promise<MaterialSubsectionDetailsDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })
    await this.assertSectionBelongsToGroup(this.prismaService, groupId, sectionId)

    const subsection = await this.prismaService.$transaction(async (tx) => {
      const createdSubsection = await tx.materialSubsection.create({
        data: {
          groupId,
          sectionId,
          title: payload.title,
          sortOrder: payload.sortOrder ?? (await this.getNextSubsectionSortOrder(tx, sectionId)),
          createdByUserId: userId,
        },
        select: {
          id: true,
        },
      })

      return this.getSubsectionDetailsRecordOrThrow(tx, groupId, createdSubsection.id)
    })

    return mapMaterialSubsectionDetailsToDto(subsection)
  }

  async updateSection(
    groupId: string,
    sectionId: string,
    userId: string,
    payload: UpdateMaterialSectionRequestDto,
  ): Promise<MaterialSectionDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })
    await this.assertSectionBelongsToGroup(this.prismaService, groupId, sectionId)

    const section = await this.prismaService.$transaction(async (tx) => {
      await tx.materialSection.update({
        where: {
          id: sectionId,
        },
        data: {
          title: payload.title,
          sortOrder: payload.sortOrder,
        },
        select: {
          id: true,
        },
      })

      return this.getSectionRecordOrThrow(tx, groupId, sectionId)
    })

    return mapMaterialSectionToDto(section)
  }

  async updateSubsection(
    groupId: string,
    subsectionId: string,
    userId: string,
    payload: UpdateMaterialSubsectionRequestDto,
  ): Promise<MaterialSubsectionDetailsDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })
    await this.assertSubsectionBelongsToGroup(this.prismaService, groupId, subsectionId)

    const subsection = await this.prismaService.$transaction(async (tx) => {
      await tx.materialSubsection.update({
        where: {
          id: subsectionId,
        },
        data: {
          title: payload.title,
          sortOrder: payload.sortOrder,
        },
        select: {
          id: true,
        },
      })

      return this.getSubsectionDetailsRecordOrThrow(tx, groupId, subsectionId)
    })

    return mapMaterialSubsectionDetailsToDto(subsection)
  }

  async getSubsection(
    groupId: string,
    subsectionId: string,
    userId: string,
  ): Promise<MaterialSubsectionDetailsDto> {
    await this.assertGroupAccess(groupId, userId)

    const subsection = await this.getSubsectionDetailsRecordOrThrow(
      this.prismaService,
      groupId,
      subsectionId,
    )

    return mapMaterialSubsectionDetailsToDto(subsection)
  }

  async deleteSection(groupId: string, sectionId: string, userId: string): Promise<void> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })
    await this.assertSectionBelongsToGroup(this.prismaService, groupId, sectionId)

    await this.prismaService.$transaction(async (tx) => {
      await tx.lesson.deleteMany({
        where: {
          groupId,
          materialSubsection: {
            sectionId,
          },
        },
      })

      await tx.materialSection.delete({
        where: {
          id: sectionId,
        },
      })
    })
  }

  async deleteSubsection(groupId: string, subsectionId: string, userId: string): Promise<void> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })
    await this.assertSubsectionBelongsToGroup(this.prismaService, groupId, subsectionId)

    await this.prismaService.$transaction(async (tx) => {
      await tx.lesson.deleteMany({
        where: {
          groupId,
          materialSubsectionId: subsectionId,
        },
      })

      await tx.materialSubsection.delete({
        where: {
          id: subsectionId,
        },
      })
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
      requiredFeature: 'lessonsEnabled',
      featureErrorMessage: 'Materials module is disabled for this group',
      requiredRoles: options.requireManage ? [...MATERIAL_MANAGE_ROLES] : undefined,
      roleErrorMessage: 'You cannot manage materials in this group',
      requireWritable: options.requireWritable ?? false,
    })
  }

  private async assertSectionBelongsToGroup(
    executor: PrismaExecutor,
    groupId: string,
    sectionId: string,
  ) {
    const section = await executor.materialSection.findFirst({
      where: {
        id: sectionId,
        groupId,
      },
      select: {
        id: true,
      },
    })

    if (!section) {
      throw new NotFoundException('Material section not found')
    }
  }

  private async assertSubsectionBelongsToGroup(
    executor: PrismaExecutor,
    groupId: string,
    subsectionId: string,
  ) {
    const subsection = await executor.materialSubsection.findFirst({
      where: {
        id: subsectionId,
        groupId,
      },
      select: {
        id: true,
      },
    })

    if (!subsection) {
      throw new NotFoundException('Material subsection not found')
    }
  }

  private async getSectionRecordOrThrow(
    executor: PrismaExecutor,
    groupId: string,
    sectionId: string,
  ): Promise<MaterialSectionRecord> {
    const section = await executor.materialSection.findFirst({
      where: {
        id: sectionId,
        groupId,
      },
      select: materialSectionSelect,
    })

    if (!section) {
      throw new NotFoundException('Material section not found')
    }

    return section
  }

  private async getSubsectionDetailsRecordOrThrow(
    executor: PrismaExecutor,
    groupId: string,
    subsectionId: string,
  ): Promise<MaterialSubsectionDetailsRecord> {
    const subsection = await executor.materialSubsection.findFirst({
      where: {
        id: subsectionId,
        groupId,
      },
      select: materialSubsectionDetailsSelect,
    })

    if (!subsection) {
      throw new NotFoundException('Material subsection not found')
    }

    return subsection
  }

  private async getNextSectionSortOrder(executor: PrismaExecutor, groupId: string) {
    const aggregate = await executor.materialSection.aggregate({
      where: {
        groupId,
      },
      _max: {
        sortOrder: true,
      },
    })

    return (aggregate._max.sortOrder ?? 0) + 1
  }

  private async getNextSubsectionSortOrder(executor: PrismaExecutor, sectionId: string) {
    const aggregate = await executor.materialSubsection.aggregate({
      where: {
        sectionId,
      },
      _max: {
        sortOrder: true,
      },
    })

    return (aggregate._max.sortOrder ?? 0) + 1
  }
}
