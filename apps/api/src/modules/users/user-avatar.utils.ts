import { MinioService } from '../../storage/minio/minio.service'

type AvatarAwareUser = {
  avatarFileId: string | null
  avatarFile:
    | {
        deletedAt: Date | null
        storageKey: string
      }
    | null
}

export type AvatarUrlByFileId = ReadonlyMap<string, string>

export async function buildAvatarUrlByFileId(
  minioService: MinioService,
  users: AvatarAwareUser[],
): Promise<Map<string, string>> {
  const avatarFiles = Array.from(
    new Map(
      users.flatMap((user) => {
        if (!user.avatarFileId || user.avatarFile?.deletedAt !== null || !user.avatarFile?.storageKey) {
          return []
        }

        return [[user.avatarFileId, user.avatarFile.storageKey] as const]
      }),
    ).entries(),
  )

  if (avatarFiles.length === 0) {
    return new Map()
  }

  const urls = await Promise.all(
    avatarFiles.map(([, storageKey]) => minioService.getObjectUrl(storageKey)),
  )

  return new Map(
    avatarFiles.map(([fileId], index) => [fileId, urls[index] ?? '']),
  )
}
