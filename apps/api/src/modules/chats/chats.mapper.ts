import { ChatType, type Prisma } from '@prisma/client'
import { fileSelect, mapFileToDto } from '../files/files.mapper'
import { mapPublicUserToDto, publicUserSelect } from '../users/users.mapper'
import { ChatDto } from './dto/chat.dto'
import { MessageDto } from './dto/message.dto'

const chatMemberSelect = {
  userId: true,
  joinedAt: true,
  lastReadAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: publicUserSelect,
  },
} satisfies Prisma.ChatMemberSelect

const groupChatMemberSelect = {
  userId: true,
  joinedAt: true,
  updatedAt: true,
  user: {
    select: publicUserSelect,
  },
} satisfies Prisma.GroupMemberSelect

export const chatSelect = {
  id: true,
  chatType: true,
  groupId: true,
  title: true,
  createdByUserId: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  members: {
    select: chatMemberSelect,
    orderBy: [
      {
        joinedAt: 'asc',
      },
      {
        userId: 'asc',
      },
    ],
  },
  group: {
    select: {
      members: {
        select: groupChatMemberSelect,
        orderBy: [
          {
            joinedAt: 'asc',
          },
          {
            userId: 'asc',
          },
        ],
      },
    },
  },
} satisfies Prisma.ChatSelect

export type ChatRecord = Prisma.ChatGetPayload<{
  select: typeof chatSelect
}>

export const messageSelect = {
  id: true,
  chatId: true,
  authorId: true,
  text: true,
  editedAt: true,
  deletedAt: true,
  createdAt: true,
  files: {
    select: {
      file: {
        select: fileSelect,
      },
    },
    orderBy: [
      {
        sortOrder: 'asc',
      },
      {
        fileId: 'asc',
      },
    ],
  },
  author: {
    select: publicUserSelect,
  },
} satisfies Prisma.MessageSelect

export type MessageRecord = Prisma.MessageGetPayload<{
  select: typeof messageSelect
}>

export function mapChatToDto(chat: ChatRecord): ChatDto {
  const members =
    chat.chatType === ChatType.GROUP && chat.group
      ? mapGroupChatMembers(chat)
      : chat.members.map((member) => ({
          userId: member.userId,
          joinedAt: member.joinedAt.toISOString(),
          lastReadAt: member.lastReadAt?.toISOString() ?? null,
          createdAt: member.createdAt.toISOString(),
          updatedAt: member.updatedAt.toISOString(),
          user: mapPublicUserToDto(member.user),
        }))

  return {
    id: chat.id,
    chatType: chat.chatType,
    groupId: chat.groupId,
    title: chat.title,
    createdByUserId: chat.createdByUserId,
    lastMessageAt: chat.lastMessageAt?.toISOString() ?? null,
    members,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
  }
}

export function mapMessageToDto(
  message: MessageRecord,
  fileUrlsById: Map<string, string>,
): MessageDto {
  const isDeleted = message.deletedAt !== null

  return {
    id: message.id,
    chatId: message.chatId,
    authorId: message.authorId,
    text: isDeleted ? null : message.text,
    files: isDeleted
      ? []
      : message.files.map((link) => mapFileToDto(link.file, fileUrlsById.get(link.file.id) ?? '')),
    editedAt: message.editedAt?.toISOString() ?? null,
    deletedAt: message.deletedAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
    author: mapPublicUserToDto(message.author),
  }
}

function mapGroupChatMembers(chat: ChatRecord) {
  const chatMembersByUserId = new Map(chat.members.map((member) => [member.userId, member]))

  return chat.group?.members.map((member) => {
    const chatMember = chatMembersByUserId.get(member.userId)

    return {
      userId: member.userId,
      joinedAt: (chatMember?.joinedAt ?? member.joinedAt).toISOString(),
      lastReadAt: chatMember?.lastReadAt?.toISOString() ?? null,
      createdAt: (chatMember?.createdAt ?? member.joinedAt).toISOString(),
      updatedAt: (chatMember?.updatedAt ?? member.updatedAt).toISOString(),
      user: mapPublicUserToDto(chatMember?.user ?? member.user),
    }
  }) ?? []
}
