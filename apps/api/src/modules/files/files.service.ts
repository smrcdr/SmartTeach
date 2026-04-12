import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { basename, extname } from 'node:path'
import { CodeGeneratorService } from '../../common/code-generator.service'
import { PrismaService } from '../../database/prisma/prisma.service'
import { MinioService } from '../../storage/minio/minio.service'
import { fileSelect, mapFileToDto } from './files.mapper'

type UploadedFilePayload = {
  buffer: Buffer
  size: number
  originalname: string
  mimetype: string
}

@Injectable()
export class FilesService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(MinioService) private readonly minioService: MinioService,
    @Inject(CodeGeneratorService)
    private readonly codeGeneratorService: CodeGeneratorService,
  ) {}

  async uploadFile(userId: string, uploadedFile: UploadedFilePayload | undefined, folder?: string) {
    if (!uploadedFile || uploadedFile.size <= 0 || uploadedFile.buffer.length === 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['file: File is required'],
      })
    }

    const storageKey = this.buildStorageKey(folder, uploadedFile.originalname)
    const originalName = this.normalizeOriginalName(uploadedFile.originalname)
    const mimeType = this.normalizeMimeType(uploadedFile.mimetype)

    await this.minioService.uploadObject({
      objectName: storageKey,
      body: uploadedFile.buffer,
      contentType: mimeType,
    })

    try {
      const file = await this.prismaService.file.create({
        data: {
          storageKey,
          originalName,
          mimeType,
          sizeBytes: BigInt(uploadedFile.size),
          uploadedByUserId: userId,
        },
        select: fileSelect,
      })

      return mapFileToDto(file, await this.minioService.getObjectUrl(file.storageKey))
    } catch (error) {
      try {
        await this.minioService.removeObject(storageKey)
      } catch {}

      throw error
    }
  }

  async getFileOrThrow(fileId: string, userId: string) {
    const file = await this.prismaService.file.findUnique({
      where: {
        id: fileId,
      },
      select: fileSelect,
    })

    if (!file || file.deletedAt || file.uploadedByUserId !== userId) {
      throw new NotFoundException('File not found')
    }

    return mapFileToDto(file, await this.minioService.getObjectUrl(file.storageKey))
  }

  async deleteFile(fileId: string, userId: string) {
    const file = await this.prismaService.file.findUnique({
      where: {
        id: fileId,
      },
      select: {
        id: true,
        uploadedByUserId: true,
        deletedAt: true,
        _count: {
          select: {
            avatarUsers: true,
            lessonFiles: true,
            assignmentFiles: true,
            submissionFiles: true,
            messageFiles: true,
          },
        },
      },
    })

    if (!file || file.deletedAt) {
      throw new NotFoundException('File not found')
    }

    if (file.uploadedByUserId !== userId) {
      throw new ForbiddenException('You cannot delete this file')
    }

    if (
      file._count.avatarUsers > 0 ||
      file._count.lessonFiles > 0 ||
      file._count.assignmentFiles > 0 ||
      file._count.submissionFiles > 0 ||
      file._count.messageFiles > 0
    ) {
      throw new ConflictException('File is still attached to existing resources')
    }

    await this.prismaService.file.update({
      where: {
        id: file.id,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  private buildStorageKey(folder: string | undefined, originalName: string) {
    const normalizedFolder = folder ?? 'misc'
    const extension = this.extractSafeExtension(originalName)
    const now = new Date()
    const year = String(now.getUTCFullYear())
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')

    return `${normalizedFolder}/${year}/${month}/${day}/${this.codeGeneratorService.generateToken(24)}${extension}`
  }

  private extractSafeExtension(originalName: string) {
    const extension = extname(this.normalizeOriginalName(originalName)).toLowerCase()

    if (!extension || !/^\.[a-z0-9]{1,16}$/.test(extension)) {
      return ''
    }

    return extension
  }

  private normalizeOriginalName(originalName: string) {
    const normalized = basename(originalName).trim()

    return normalized.length > 0 ? normalized : 'file'
  }

  private normalizeMimeType(mimeType: string) {
    const normalized = mimeType.trim()

    return normalized.length > 0 ? normalized : 'application/octet-stream'
  }
}
