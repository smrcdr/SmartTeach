import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ChatType, GroupRole, GroupStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { MinioService } from '../../storage/minio/minio.service'
import { ChatRealtimePublisher } from './chat-realtime.publisher'
import { chatSelect, ChatRecord, mapChatToDto, mapMessageToDto, MessageRecord, messageSelect } from './chats.mapper'
import { CreateDirectChatRequestDto } from './dto/create-direct-chat-request.dto'
import { ChatDto } from './dto/chat.dto'
import { GroupChatCreateRequestDto } from './dto/group-chat-create-request.dto'
import { GroupChatUpdateRequestDto } from './dto/group-chat-update-request.dto'
import { ListChatsQueryDto } from './dto/list-chats-query.dto'
import { ListMessagesQueryDto } from './dto/list-messages-query.dto'
import { MessageCreateRequestDto } from './dto/message-create-request.dto'
import { MessageDto } from './dto/message.dto'
import { MessageUpdateRequestDto } from './dto/message-update-request.dto'

const CHAT_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])
const DEFAULT_MESSAGE_LIMIT = 50

type PrismaExecutor = Prisma.TransactionClient | PrismaService

@Injectable()
export class ChatsService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(MinioService) private readonly minioService: MinioService,
    @Inject(ChatRealtimePublisher)
    private readonly chatRealtimePublisher: ChatRealtimePublisher,
  ) {}

  async listGroupChats(groupId: string, userId: string): Promise<ChatDto[]> {
    await this.assertGroupAccess(groupId, userId)

    const chats = await this.prismaService.chat.findMany({
      where: {
        groupId,
        chatType: ChatType.GROUP,
      },
      select: chatSelect,
      orderBy: [
        {
          lastMessageAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    })

    return chats.map(mapChatToDto)
  }

  async createGroupChat(
    groupId: string,
    userId: string,
    payload: GroupChatCreateRequestDto,
  ): Promise<ChatDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const groupMembers = await this.prismaService.groupMember.findMany({
      where: {
        groupId,
      },
      select: {
        userId: true,
      },
    })

    const chat = await this.prismaService.$transaction(async (tx) => {
      const createdChat = await tx.chat.create({
        data: {
          chatType: ChatType.GROUP,
          groupId,
          title: payload.title.trim(),
          createdByUserId: userId,
        },
        select: {
          id: true,
        },
      })

      if (groupMembers.length > 0) {
        await tx.chatMember.createMany({
          data: groupMembers.map((member) => ({
            chatId: createdChat.id,
            userId: member.userId,
          })),
        })
      }

      return this.getGroupChatRecordOrThrow(tx, groupId, createdChat.id)
    })

    return mapChatToDto(chat)
  }

  async updateGroupChat(
    groupId: string,
    chatId: string,
    userId: string,
    payload: GroupChatUpdateRequestDto,
  ): Promise<ChatDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const existingChat = await this.getGroupChatRecordOrThrow(this.prismaService, groupId, chatId)

    if (payload.title === undefined) {
      return mapChatToDto(existingChat)
    }

    const title = payload.title.trim()

    if (title === existingChat.title) {
      return mapChatToDto(existingChat)
    }

    const updatedChat = await this.prismaService.chat.update({
      where: {
        id: chatId,
      },
      data: {
        title,
      },
      select: chatSelect,
    })

    return mapChatToDto(updatedChat)
  }

  async deleteGroupChat(groupId: string, chatId: string, userId: string) {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })
    await this.getGroupChatRecordOrThrow(this.prismaService, groupId, chatId)

    await this.prismaService.chat.delete({
      where: {
        id: chatId,
      },
    })
  }

  async listChats(userId: string, query: ListChatsQueryDto): Promise<ChatDto[]> {
    if (query.groupId) {
      await this.assertGroupAccess(query.groupId, userId, {
        requireChatEnabled: query.chatType !== ChatType.DIRECT,
      })
    }

    const chats = await this.prismaService.chat.findMany({
      where: this.buildListChatsWhere(userId, query),
      select: chatSelect,
      orderBy: [
        {
          lastMessageAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    })

    return chats.map(mapChatToDto)
  }

  async createOrGetDirectChat(
    userId: string,
    payload: CreateDirectChatRequestDto,
  ): Promise<ChatDto> {
    if (payload.userId === userId) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['userId: Direct chat requires another user'],
      })
    }

    await this.requireUserExists(payload.userId)

    const directChatKey = this.buildDirectChatKey(userId, payload.userId)

    try {
      const chat = await this.prismaService.$transaction(async (tx) => {
        const existingChat = await tx.chat.findUnique({
          where: {
            directChatKey,
          },
          select: chatSelect,
        })

        if (existingChat) {
          return existingChat
        }

        const createdChat = await tx.chat.create({
          data: {
            chatType: ChatType.DIRECT,
            directChatKey,
            createdByUserId: userId,
          },
          select: {
            id: true,
          },
        })

        await tx.chatMember.createMany({
          data: [
            {
              chatId: createdChat.id,
              userId,
            },
            {
              chatId: createdChat.id,
              userId: payload.userId,
            },
          ],
        })

        return this.getDirectChatByKeyOrThrow(tx, directChatKey)
      })

      return mapChatToDto(chat)
    } catch (error) {
      if (!this.isDirectChatKeyConflict(error)) {
        throw error
      }

      const chat = await this.getDirectChatByKeyOrThrow(this.prismaService, directChatKey)

      return mapChatToDto(chat)
    }
  }

  async getChat(chatId: string, userId: string): Promise<ChatDto> {
    await this.assertChatAccess(chatId, userId)

    const chat = await this.getChatRecordOrThrow(this.prismaService, chatId)

    return mapChatToDto(chat)
  }

  async ensureChatAccess(chatId: string, userId: string) {
    await this.assertChatAccess(chatId, userId)
  }

  async listMessages(
    chatId: string,
    userId: string,
    query: ListMessagesQueryDto,
  ): Promise<MessageDto[]> {
    await this.assertChatAccess(chatId, userId)

    const messages = await this.prismaService.message.findMany({
      where: {
        chatId,
        ...(query.before
          ? {
              createdAt: {
                lt: new Date(query.before),
              },
            }
          : {}),
      },
      select: messageSelect,
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      take: query.limit ?? DEFAULT_MESSAGE_LIMIT,
    })

    return this.mapMessageRecordsToDto(messages.reverse())
  }

  async createMessage(
    chatId: string,
    userId: string,
    payload: MessageCreateRequestDto,
  ): Promise<MessageDto> {
    await this.assertChatAccess(chatId, userId, {
      requireWritable: true,
    })

    const text = this.normalizeNullableText(payload.text)
    const fileIds = this.normalizeFileIds(payload.fileIds)

    if (text === undefined && fileIds.length === 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['text: Message must contain text or at least one attachment'],
      })
    }

    await this.assertAttachableMessageFiles(fileIds, userId)

    const message = await this.prismaService.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          chatId,
          authorId: userId,
          text: text ?? null,
        },
        select: {
          id: true,
          createdAt: true,
        },
      })

      await this.syncMessageFiles(tx, createdMessage.id, fileIds)

      await tx.chat.update({
        where: {
          id: chatId,
        },
        data: {
          lastMessageAt: createdMessage.createdAt,
        },
      })

      return this.getMessageRecordOrThrow(tx, chatId, createdMessage.id)
    })

    const messageDto = await this.mapMessageRecordToDto(message)

    this.chatRealtimePublisher.emitMessageCreated(messageDto)

    return messageDto
  }

  async updateMessage(
    chatId: string,
    messageId: string,
    userId: string,
    payload: MessageUpdateRequestDto,
  ): Promise<MessageDto> {
    await this.assertChatAccess(chatId, userId, {
      requireWritable: true,
    })

    const existingMessage = await this.getMessageRecordOrThrow(this.prismaService, chatId, messageId)

    if (existingMessage.authorId !== userId) {
      throw new ForbiddenException('You cannot edit this message')
    }

    if (existingMessage.deletedAt) {
      throw new ForbiddenException('Deleted messages are read-only')
    }

    const fileIds = payload.fileIds !== undefined ? this.normalizeFileIds(payload.fileIds) : undefined

    if (fileIds !== undefined) {
      await this.assertAttachableMessageFiles(fileIds, userId)
    }

    const currentFileIds = existingMessage.files.map((link) => link.file.id)
    const nextText =
      payload.text !== undefined ? this.normalizeNullableText(payload.text) ?? null : existingMessage.text
    const nextFileIds = fileIds ?? currentFileIds

    if (nextText === null && nextFileIds.length === 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['text: Message must contain text or at least one attachment'],
      })
    }

    const textChanged = nextText !== existingMessage.text
    const filesChanged =
      fileIds !== undefined && !this.areStringArraysEqual(currentFileIds, nextFileIds)

    if (!textChanged && !filesChanged) {
      return this.mapMessageRecordToDto(existingMessage)
    }

    const updatedMessage = await this.prismaService.$transaction(async (tx) => {
      const data: Prisma.MessageUpdateInput = {
        editedAt: new Date(),
      }

      if (textChanged) {
        data.text = nextText
      }

      await tx.message.update({
        where: {
          id: messageId,
        },
        data,
      })

      if (fileIds !== undefined) {
        await this.syncMessageFiles(tx, messageId, fileIds)
      }

      return this.getMessageRecordOrThrow(tx, chatId, messageId)
    })

    const messageDto = await this.mapMessageRecordToDto(updatedMessage)

    this.chatRealtimePublisher.emitMessageUpdated(messageDto)

    return messageDto
  }

  async deleteMessage(chatId: string, messageId: string, userId: string) {
    const access = await this.assertChatAccess(chatId, userId, {
      requireWritable: true,
    })
    const message = await this.getMessageRecordOrThrow(this.prismaService, chatId, messageId)
    const canDelete =
      message.authorId === userId ||
      (access.chatType === ChatType.GROUP &&
        access.groupRole !== undefined &&
        CHAT_MANAGE_ROLES.has(access.groupRole))

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this message')
    }

    if (message.deletedAt) {
      return
    }

    const deletedMessage = await this.prismaService.$transaction(async (tx) => {
      await tx.message.update({
        where: {
          id: messageId,
        },
        data: {
          deletedAt: new Date(),
        },
      })

      return this.getMessageRecordOrThrow(tx, chatId, messageId)
    })

    const messageDto = await this.mapMessageRecordToDto(deletedMessage)

    this.chatRealtimePublisher.emitMessageDeleted(messageDto)
  }

  private async assertGroupAccess(
    groupId: string,
    userId: string,
    options: {
      requireManage?: boolean
      requireWritable?: boolean
      requireChatEnabled?: boolean
    } = {},
  ) {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        status: true,
        settings: {
          select: {
            chatEnabled: true,
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

    if (!group || group.status === GroupStatus.DELETED) {
      throw new NotFoundException('Group not found')
    }

    const membership = group.members[0]

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group')
    }

    if (!group.settings) {
      throw new NotFoundException('Group settings not found')
    }

    if ((options.requireChatEnabled ?? true) && !group.settings.chatEnabled) {
      throw new ForbiddenException('Chats module is disabled for this group')
    }

    if (options.requireManage && !CHAT_MANAGE_ROLES.has(membership.role)) {
      throw new ForbiddenException('You cannot manage chats in this group')
    }

    if (options.requireWritable && group.status === GroupStatus.ARCHIVED) {
      throw new ForbiddenException('Archived groups are read-only')
    }

    return {
      role: membership.role,
    }
  }

  private async assertChatAccess(
    chatId: string,
    userId: string,
    options: {
      requireWritable?: boolean
    } = {},
  ) {
    const chat = await this.prismaService.chat.findUnique({
      where: {
        id: chatId,
      },
      select: {
        id: true,
        chatType: true,
        groupId: true,
      },
    })

    if (!chat) {
      throw new NotFoundException('Chat not found')
    }

    if (chat.chatType === ChatType.GROUP) {
      if (!chat.groupId) {
        throw new NotFoundException('Chat not found')
      }

      const groupAccess = await this.assertGroupAccess(chat.groupId, userId, {
        requireWritable: options.requireWritable,
      })

      return {
        chatType: chat.chatType,
        groupId: chat.groupId,
        groupRole: groupAccess.role,
      }
    }

    const membership = await this.prismaService.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
      select: {
        chatId: true,
      },
    })

    if (!membership) {
      throw new ForbiddenException('You are not a member of this chat')
    }

    return {
      chatType: chat.chatType,
      groupId: null,
      groupRole: undefined,
    }
  }

  private buildListChatsWhere(userId: string, query: ListChatsQueryDto): Prisma.ChatWhereInput {
    const visibilityFilters: Prisma.ChatWhereInput[] = []

    if (query.chatType !== ChatType.GROUP) {
      visibilityFilters.push({
        chatType: ChatType.DIRECT,
        members: {
          some: {
            userId,
          },
        },
      })
    }

    if (query.chatType !== ChatType.DIRECT) {
      visibilityFilters.push({
        chatType: ChatType.GROUP,
        group: {
          is: {
            status: {
              not: GroupStatus.DELETED,
            },
            settings: {
              is: {
                chatEnabled: true,
              },
            },
            members: {
              some: {
                userId,
              },
            },
          },
        },
      })
    }

    return {
      AND: [
        ...(query.chatType
          ? [
              {
                chatType: query.chatType,
              } satisfies Prisma.ChatWhereInput,
            ]
          : []),
        ...(query.groupId
          ? [
              {
                groupId: query.groupId,
              } satisfies Prisma.ChatWhereInput,
            ]
          : []),
        {
          OR: visibilityFilters,
        } satisfies Prisma.ChatWhereInput,
      ],
    }
  }

  private async getChatRecordOrThrow(
    executor: PrismaExecutor,
    chatId: string,
  ): Promise<ChatRecord> {
    const chat = await executor.chat.findUnique({
      where: {
        id: chatId,
      },
      select: chatSelect,
    })

    if (!chat) {
      throw new NotFoundException('Chat not found')
    }

    return chat
  }

  private async getGroupChatRecordOrThrow(
    executor: PrismaExecutor,
    groupId: string,
    chatId: string,
  ): Promise<ChatRecord> {
    const chat = await executor.chat.findFirst({
      where: {
        id: chatId,
        groupId,
        chatType: ChatType.GROUP,
      },
      select: chatSelect,
    })

    if (!chat) {
      throw new NotFoundException('Chat not found')
    }

    return chat
  }

  private async getDirectChatByKeyOrThrow(
    executor: PrismaExecutor,
    directChatKey: string,
  ): Promise<ChatRecord> {
    const chat = await executor.chat.findUnique({
      where: {
        directChatKey,
      },
      select: chatSelect,
    })

    if (!chat) {
      throw new NotFoundException('Chat not found')
    }

    return chat
  }

  private async getMessageRecordOrThrow(
    executor: PrismaExecutor,
    chatId: string,
    messageId: string,
  ): Promise<MessageRecord> {
    const message = await executor.message.findFirst({
      where: {
        id: messageId,
        chatId,
      },
      select: messageSelect,
    })

    if (!message) {
      throw new NotFoundException('Message not found')
    }

    return message
  }

  private async requireUserExists(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }
  }

  private normalizeFileIds(fileIds?: string[]) {
    if (!fileIds || fileIds.length === 0) {
      return []
    }

    const normalizedFileIds: string[] = []
    const seen = new Set<string>()

    for (const fileId of fileIds) {
      if (seen.has(fileId)) {
        continue
      }

      seen.add(fileId)
      normalizedFileIds.push(fileId)
    }

    return normalizedFileIds
  }

  private normalizeNullableText(value?: string) {
    if (value === undefined) {
      return undefined
    }

    const normalized = value.trim()

    return normalized.length > 0 ? normalized : null
  }

  private async assertAttachableMessageFiles(fileIds: string[], userId: string) {
    if (fileIds.length === 0) {
      return
    }

    const files = await this.prismaService.file.findMany({
      where: {
        id: {
          in: fileIds,
        },
      },
      select: {
        id: true,
        uploadedByUserId: true,
        deletedAt: true,
      },
    })
    const filesById = new Map(files.map((file) => [file.id, file]))

    for (const fileId of fileIds) {
      const file = filesById.get(fileId)

      if (!file || file.deletedAt) {
        throw new NotFoundException('File not found')
      }

      if (file.uploadedByUserId !== userId) {
        throw new ForbiddenException('You cannot attach this file')
      }
    }
  }

  private async syncMessageFiles(
    executor: Prisma.TransactionClient,
    messageId: string,
    fileIds: string[],
  ) {
    if (fileIds.length === 0) {
      await executor.messageFile.deleteMany({
        where: {
          messageId,
        },
      })

      return
    }

    await executor.messageFile.deleteMany({
      where: {
        messageId,
        fileId: {
          notIn: fileIds,
        },
      },
    })

    for (const [index, fileId] of fileIds.entries()) {
      await executor.messageFile.upsert({
        where: {
          messageId_fileId: {
            messageId,
            fileId,
          },
        },
        update: {
          sortOrder: index + 1,
        },
        create: {
          messageId,
          fileId,
          sortOrder: index + 1,
        },
      })
    }
  }

  private async mapMessageRecordToDto(message: MessageRecord): Promise<MessageDto> {
    const fileUrlsById = await this.buildFileUrlsById(
      message.deletedAt === null
        ? message.files.map((link) => ({
            id: link.file.id,
            storageKey: link.file.storageKey,
          }))
        : [],
    )

    return mapMessageToDto(message, fileUrlsById)
  }

  private async mapMessageRecordsToDto(messages: MessageRecord[]): Promise<MessageDto[]> {
    const fileUrlsById = await this.buildFileUrlsById(
      messages.flatMap((message) =>
        message.deletedAt === null
          ? message.files.map((link) => ({
              id: link.file.id,
              storageKey: link.file.storageKey,
            }))
          : [],
      ),
    )

    return messages.map((message) => mapMessageToDto(message, fileUrlsById))
  }

  private async buildFileUrlsById(files: Array<{ id: string; storageKey: string }>) {
    const uniqueFiles = Array.from(
      new Map(files.map((file) => [file.id, file])).values(),
    )

    const urls = await Promise.all(
      uniqueFiles.map((file) => this.minioService.getObjectUrl(file.storageKey)),
    )

    return new Map(uniqueFiles.map((file, index) => [file.id, urls[index] ?? '']))
  }

  private buildDirectChatKey(firstUserId: string, secondUserId: string) {
    return [firstUserId, secondUserId].sort().join(':')
  }

  private isDirectChatKeyConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.some((field) =>
        ['directChatKey', 'direct_chat_key'].includes(String(field)),
      )
    )
  }

  private areStringArraysEqual(left: string[], right: string[]) {
    if (left.length !== right.length) {
      return false
    }

    return left.every((value, index) => value === right[index])
  }
}
