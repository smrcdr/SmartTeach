import type { Prisma } from '@prisma/client'
import { FileObjectDto } from './dto/file-object.dto'

export const fileSelect = {
  id: true,
  storageKey: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  uploadedByUserId: true,
  createdAt: true,
  deletedAt: true,
} satisfies Prisma.FileSelect

export type FileRecord = Prisma.FileGetPayload<{
  select: typeof fileSelect
}>

export function mapFileToDto(file: FileRecord, url: string): FileObjectDto {
  return {
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: Number(file.sizeBytes),
    uploadedByUserId: file.uploadedByUserId,
    url,
    createdAt: file.createdAt.toISOString(),
  }
}
