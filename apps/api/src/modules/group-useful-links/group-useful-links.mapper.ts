import type { Prisma } from '@prisma/client'
import { fileSelect, mapFileToDto } from '../files/files.mapper'
import { GroupUsefulLinkDto } from './dto/group-useful-link.dto'

export const groupUsefulLinkSelect = {
  id: true,
  groupId: true,
  title: true,
  url: true,
  sortOrder: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
  imageFile: {
    select: fileSelect,
  },
} satisfies Prisma.GroupUsefulLinkSelect

export type GroupUsefulLinkRecord = Prisma.GroupUsefulLinkGetPayload<{
  select: typeof groupUsefulLinkSelect
}>

export function mapGroupUsefulLinkToDto(
  usefulLink: GroupUsefulLinkRecord,
  imageUrl: string | null,
): GroupUsefulLinkDto {
  return {
    id: usefulLink.id,
    groupId: usefulLink.groupId,
    title: usefulLink.title,
    url: usefulLink.url,
    image: usefulLink.imageFile ? mapFileToDto(usefulLink.imageFile, imageUrl ?? '') : null,
    sortOrder: usefulLink.sortOrder,
    createdByUserId: usefulLink.createdByUserId,
    createdAt: usefulLink.createdAt.toISOString(),
    updatedAt: usefulLink.updatedAt.toISOString(),
  }
}
