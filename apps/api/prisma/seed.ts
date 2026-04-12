import { hash } from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  AssignmentStatus,
  ChatType,
  GroupAccessMode,
  GroupRole,
  GroupStatus,
  JoinRequestStatus,
  LessonStatus,
  Prisma,
  PrismaClient,
  ScheduleEventStatus,
  SubmissionStatus,
} from '@prisma/client'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the Prisma seed.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})
const seedPassword = 'Password123!'

const ids = {
  users: {
    alex: '11111111-1111-4111-8111-111111111111',
    maria: '22222222-2222-4222-8222-222222222222',
    ivan: '33333333-3333-4333-8333-333333333333',
    sofia: '44444444-4444-4444-8444-444444444444',
    nina: '55555555-5555-4555-8555-555555555555',
  },
  files: {
    alexAvatar: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    sofiaAvatar: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    webLessonGuide: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    webAssignmentBrief: 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    ivanSubmissionPdf: 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    groupChatAttachment: 'aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
  },
  groups: {
    webBasics: '66666666-6666-4666-8666-666666666666',
    mathLab: '77777777-7777-4777-8777-777777777777',
    archivedClub: '88888888-8888-4888-8888-888888888888',
  },
  joinRequests: {
    alexApproved: '99999991-9999-4999-8999-999999999991',
    sofiaPending: '99999992-9999-4999-8999-999999999992',
    ninaRejected: '99999993-9999-4999-8999-999999999993',
  },
  lessons: {
    webIntro: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    webPractice: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    mathWorkshop: 'bbbbbbb3-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
    archivedLesson: 'bbbbbbb4-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
  },
  assignments: {
    webHomework: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    webCapstone: 'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    mathReview: 'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3',
    archivedBrief: 'ccccccc4-cccc-4ccc-8ccc-ccccccccccc4',
  },
  submissions: {
    ivanReviewed: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
    ivanDraft: 'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2',
    sofiaSubmitted: 'ddddddd3-dddd-4ddd-8ddd-ddddddddddd3',
  },
  scheduleEvents: {
    webOfficeHours: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
    mathConsultation: 'eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2',
  },
  chats: {
    webGroup: 'fffffff1-ffff-4fff-8fff-fffffffffff1',
    mathGroup: 'fffffff2-ffff-4fff-8fff-fffffffffff2',
    alexIvanDirect: 'fffffff3-ffff-4fff-8fff-fffffffffff3',
  },
  messages: {
    webWelcome: '12121212-1212-4212-8212-121212121212',
    webAttachment: '23232323-2323-4232-8232-232323232323',
    directCheckIn: '34343434-3434-4343-8343-343434343434',
    directReply: '45454545-4545-4454-8454-454545454545',
  },
} as const

function at(value: string) {
  return new Date(value)
}

function buildDirectChatKey(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join(':')
}

async function resetDatabase() {
  await prisma.$transaction([
    prisma.messageFile.deleteMany(),
    prisma.message.deleteMany(),
    prisma.chatMember.deleteMany(),
    prisma.chat.deleteMany(),
    prisma.submissionFile.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.assignmentFile.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.lessonFile.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.scheduleEvent.deleteMany(),
    prisma.groupJoinRequest.deleteMany(),
    prisma.groupMember.deleteMany(),
    prisma.groupSettings.deleteMany(),
    prisma.group.deleteMany(),
    prisma.file.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ])
}

async function seedUsers(passwordHash: string) {
  const users = [
    {
      id: ids.users.alex,
      email: 'alex.teacher@smarteach.local',
      passwordHash,
      displayName: 'Alex Teacher',
      bio: 'Преподает веб-разработку и ведет открытые учебные группы.',
      createdAt: at('2026-02-01T08:00:00.000Z'),
      updatedAt: at('2026-03-01T08:00:00.000Z'),
    },
    {
      id: ids.users.maria,
      email: 'maria.mentor@smarteach.local',
      passwordHash,
      displayName: 'Maria Mentor',
      bio: 'Курирует лаборатории и принимает заявки в закрытые учебные потоки.',
      createdAt: at('2026-02-03T09:15:00.000Z'),
      updatedAt: at('2026-03-02T09:15:00.000Z'),
    },
    {
      id: ids.users.ivan,
      email: 'ivan.student@smarteach.local',
      passwordHash,
      displayName: 'Ivan Student',
      bio: 'Студент, активно работает над домашними заданиями и помогает в чате.',
      createdAt: at('2026-02-07T10:30:00.000Z'),
      updatedAt: at('2026-03-05T10:30:00.000Z'),
    },
    {
      id: ids.users.sofia,
      email: 'sofia.student@smarteach.local',
      passwordHash,
      displayName: 'Sofia Student',
      bio: 'Участница открытой группы, ожидает вступления в лабораторию по заявке.',
      createdAt: at('2026-02-10T07:45:00.000Z'),
      updatedAt: at('2026-03-06T07:45:00.000Z'),
    },
    {
      id: ids.users.nina,
      email: 'nina.observer@smarteach.local',
      passwordHash,
      displayName: 'Nina Observer',
      bio: 'Тестовый пользователь для сценариев отказа во вступлении.',
      createdAt: at('2026-02-12T11:20:00.000Z'),
      updatedAt: at('2026-03-07T11:20:00.000Z'),
    },
  ] satisfies Prisma.UserCreateManyInput[]

  await prisma.user.createMany({ data: users })
}

async function seedFiles() {
  const files = [
    {
      id: ids.files.alexAvatar,
      storageKey: 'avatars/alex-teacher.png',
      originalName: 'alex-teacher.png',
      mimeType: 'image/png',
      sizeBytes: 152_640n,
      uploadedByUserId: ids.users.alex,
      createdAt: at('2026-03-01T08:05:00.000Z'),
    },
    {
      id: ids.files.sofiaAvatar,
      storageKey: 'avatars/sofia-student.png',
      originalName: 'sofia-student.png',
      mimeType: 'image/png',
      sizeBytes: 164_320n,
      uploadedByUserId: ids.users.sofia,
      createdAt: at('2026-03-06T07:55:00.000Z'),
    },
    {
      id: ids.files.webLessonGuide,
      storageKey: 'lessons/web-basics/intro-guide.pdf',
      originalName: 'intro-guide.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2_441_728n,
      uploadedByUserId: ids.users.alex,
      createdAt: at('2026-03-12T09:10:00.000Z'),
    },
    {
      id: ids.files.webAssignmentBrief,
      storageKey: 'assignments/web-basics/landing-page-brief.docx',
      originalName: 'landing-page-brief.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 983_040n,
      uploadedByUserId: ids.users.alex,
      createdAt: at('2026-03-16T13:40:00.000Z'),
    },
    {
      id: ids.files.ivanSubmissionPdf,
      storageKey: 'submissions/web-basics/ivan-homework-v1.pdf',
      originalName: 'ivan-homework-v1.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1_572_864n,
      uploadedByUserId: ids.users.ivan,
      createdAt: at('2026-03-20T18:15:00.000Z'),
    },
    {
      id: ids.files.groupChatAttachment,
      storageKey: 'messages/web-basics/layout-reference.png',
      originalName: 'layout-reference.png',
      mimeType: 'image/png',
      sizeBytes: 524_288n,
      uploadedByUserId: ids.users.ivan,
      createdAt: at('2026-03-18T11:05:00.000Z'),
    },
  ] satisfies Prisma.FileCreateManyInput[]

  await prisma.file.createMany({ data: files })

  await prisma.user.update({
    where: { id: ids.users.alex },
    data: { avatarFileId: ids.files.alexAvatar },
  })

  await prisma.user.update({
    where: { id: ids.users.sofia },
    data: { avatarFileId: ids.files.sofiaAvatar },
  })
}

async function seedGroups() {
  const groups = [
    {
      id: ids.groups.webBasics,
      code: 'WEBSPRING26',
      name: 'Web Basics Spring 2026',
      description: 'Открытая группа для отработки HTML, CSS и базового JavaScript.',
      ownerId: ids.users.alex,
      accessMode: GroupAccessMode.OPEN,
      status: GroupStatus.ACTIVE,
      createdAt: at('2026-03-10T08:00:00.000Z'),
      updatedAt: at('2026-03-18T08:00:00.000Z'),
    },
    {
      id: ids.groups.mathLab,
      code: 'MATHLAB26',
      name: 'Math Lab 2026',
      description: 'Группа по заявкам для интенсивной подготовки и разбора задач.',
      ownerId: ids.users.maria,
      accessMode: GroupAccessMode.BY_REQUEST,
      status: GroupStatus.ACTIVE,
      createdAt: at('2026-03-11T09:30:00.000Z'),
      updatedAt: at('2026-03-19T09:30:00.000Z'),
    },
    {
      id: ids.groups.archivedClub,
      code: 'ARCHIVE26',
      name: 'Archived Design Club',
      description: 'Архивная закрытая группа для проверки сценариев чтения исторических данных.',
      ownerId: ids.users.alex,
      accessMode: GroupAccessMode.CLOSED,
      status: GroupStatus.ARCHIVED,
      createdAt: at('2026-02-15T12:00:00.000Z'),
      updatedAt: at('2026-03-01T12:00:00.000Z'),
      archivedAt: at('2026-03-01T12:00:00.000Z'),
    },
  ] satisfies Prisma.GroupCreateManyInput[]

  const groupSettings = [
    {
      groupId: ids.groups.webBasics,
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: true,
      scheduleEnabled: true,
      createdAt: at('2026-03-10T08:00:00.000Z'),
      updatedAt: at('2026-03-10T08:00:00.000Z'),
    },
    {
      groupId: ids.groups.mathLab,
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: true,
      scheduleEnabled: true,
      createdAt: at('2026-03-11T09:30:00.000Z'),
      updatedAt: at('2026-03-11T09:30:00.000Z'),
    },
    {
      groupId: ids.groups.archivedClub,
      chatEnabled: false,
      lessonsEnabled: true,
      assignmentsEnabled: true,
      scheduleEnabled: false,
      createdAt: at('2026-02-15T12:00:00.000Z'),
      updatedAt: at('2026-03-01T12:00:00.000Z'),
    },
  ] satisfies Prisma.GroupSettingsCreateManyInput[]

  const members = [
    {
      groupId: ids.groups.webBasics,
      userId: ids.users.alex,
      role: GroupRole.OWNER,
      joinedAt: at('2026-03-10T08:00:00.000Z'),
      updatedAt: at('2026-03-10T08:00:00.000Z'),
    },
    {
      groupId: ids.groups.webBasics,
      userId: ids.users.ivan,
      role: GroupRole.ADMIN,
      joinedAt: at('2026-03-10T08:20:00.000Z'),
      updatedAt: at('2026-03-16T15:00:00.000Z'),
    },
    {
      groupId: ids.groups.webBasics,
      userId: ids.users.sofia,
      role: GroupRole.USER,
      joinedAt: at('2026-03-10T08:40:00.000Z'),
      updatedAt: at('2026-03-10T08:40:00.000Z'),
    },
    {
      groupId: ids.groups.mathLab,
      userId: ids.users.maria,
      role: GroupRole.OWNER,
      joinedAt: at('2026-03-11T09:30:00.000Z'),
      updatedAt: at('2026-03-11T09:30:00.000Z'),
    },
    {
      groupId: ids.groups.mathLab,
      userId: ids.users.alex,
      role: GroupRole.USER,
      joinedAt: at('2026-03-12T10:00:00.000Z'),
      updatedAt: at('2026-03-12T10:00:00.000Z'),
    },
    {
      groupId: ids.groups.archivedClub,
      userId: ids.users.alex,
      role: GroupRole.OWNER,
      joinedAt: at('2026-02-15T12:00:00.000Z'),
      updatedAt: at('2026-03-01T12:00:00.000Z'),
    },
  ] satisfies Prisma.GroupMemberCreateManyInput[]

  const joinRequests = [
    {
      id: ids.joinRequests.alexApproved,
      groupId: ids.groups.mathLab,
      userId: ids.users.alex,
      status: JoinRequestStatus.APPROVED,
      reviewedByUserId: ids.users.maria,
      reviewedAt: at('2026-03-12T09:50:00.000Z'),
      createdAt: at('2026-03-12T09:10:00.000Z'),
      updatedAt: at('2026-03-12T09:50:00.000Z'),
    },
    {
      id: ids.joinRequests.sofiaPending,
      groupId: ids.groups.mathLab,
      userId: ids.users.sofia,
      status: JoinRequestStatus.PENDING,
      createdAt: at('2026-03-19T08:45:00.000Z'),
      updatedAt: at('2026-03-19T08:45:00.000Z'),
    },
    {
      id: ids.joinRequests.ninaRejected,
      groupId: ids.groups.mathLab,
      userId: ids.users.nina,
      status: JoinRequestStatus.REJECTED,
      reviewedByUserId: ids.users.maria,
      reviewedAt: at('2026-03-18T14:30:00.000Z'),
      createdAt: at('2026-03-18T13:55:00.000Z'),
      updatedAt: at('2026-03-18T14:30:00.000Z'),
    },
  ] satisfies Prisma.GroupJoinRequestCreateManyInput[]

  await prisma.$transaction(async (tx) => {
    await tx.group.createMany({ data: groups })
    await tx.groupSettings.createMany({ data: groupSettings })
    await tx.groupMember.createMany({ data: members })
    await tx.groupJoinRequest.createMany({ data: joinRequests })
  })
}

async function seedLearningContent() {
  const lessons = [
    {
      id: ids.lessons.webIntro,
      groupId: ids.groups.webBasics,
      title: 'Введение в структуру страницы',
      content: 'Разбираем семантическую верстку, сетки и подготовку к первой странице курса.',
      status: LessonStatus.PUBLISHED,
      sortOrder: 1,
      startsAt: at('2026-03-17T09:00:00.000Z'),
      endsAt: at('2026-03-17T10:30:00.000Z'),
      publishedAt: at('2026-03-16T18:00:00.000Z'),
      createdByUserId: ids.users.alex,
      createdAt: at('2026-03-15T14:00:00.000Z'),
      updatedAt: at('2026-03-16T18:00:00.000Z'),
    },
    {
      id: ids.lessons.webPractice,
      groupId: ids.groups.webBasics,
      title: 'Практика: адаптивные блоки',
      content: 'Черновик практического урока с фокусом на layout и responsive-поведение.',
      status: LessonStatus.DRAFT,
      sortOrder: 2,
      createdByUserId: ids.users.alex,
      createdAt: at('2026-03-18T12:00:00.000Z'),
      updatedAt: at('2026-03-18T12:00:00.000Z'),
    },
    {
      id: ids.lessons.mathWorkshop,
      groupId: ids.groups.mathLab,
      title: 'Разбор олимпиадных задач',
      content: 'Очная лаборатория с серией задач на комбинаторику и логику.',
      status: LessonStatus.PUBLISHED,
      sortOrder: 1,
      startsAt: at('2026-03-21T15:00:00.000Z'),
      endsAt: at('2026-03-21T16:30:00.000Z'),
      publishedAt: at('2026-03-20T11:00:00.000Z'),
      createdByUserId: ids.users.maria,
      createdAt: at('2026-03-19T11:00:00.000Z'),
      updatedAt: at('2026-03-20T11:00:00.000Z'),
    },
    {
      id: ids.lessons.archivedLesson,
      groupId: ids.groups.archivedClub,
      title: 'Архив: дизайн-система клуба',
      content: 'Исторический урок из закрытого клуба, нужен для проверки архивных записей.',
      status: LessonStatus.ARCHIVED,
      sortOrder: 1,
      publishedAt: at('2026-02-20T16:00:00.000Z'),
      archivedAt: at('2026-03-01T12:00:00.000Z'),
      createdByUserId: ids.users.alex,
      createdAt: at('2026-02-19T16:00:00.000Z'),
      updatedAt: at('2026-03-01T12:00:00.000Z'),
    },
  ] satisfies Prisma.LessonCreateManyInput[]

  const lessonFiles = [
    {
      lessonId: ids.lessons.webIntro,
      fileId: ids.files.webLessonGuide,
      sortOrder: 1,
      attachedAt: at('2026-03-16T18:05:00.000Z'),
    },
  ] satisfies Prisma.LessonFileCreateManyInput[]

  const assignments = [
    {
      id: ids.assignments.webHomework,
      groupId: ids.groups.webBasics,
      lessonId: ids.lessons.webIntro,
      title: 'Собрать лендинг по макету',
      content: 'Сверстать первый экран и блок преимуществ по референсу из урока.',
      status: AssignmentStatus.PUBLISHED,
      dueAt: at('2026-03-23T20:00:00.000Z'),
      maxScore: 100,
      publishedAt: at('2026-03-16T18:15:00.000Z'),
      createdByUserId: ids.users.alex,
      createdAt: at('2026-03-16T18:00:00.000Z'),
      updatedAt: at('2026-03-16T18:15:00.000Z'),
    },
    {
      id: ids.assignments.webCapstone,
      groupId: ids.groups.webBasics,
      title: 'Черновик итогового проекта',
      content: 'Заготовка финального проекта по адаптивной верстке.',
      status: AssignmentStatus.DRAFT,
      maxScore: 150,
      createdByUserId: ids.users.alex,
      createdAt: at('2026-03-18T15:00:00.000Z'),
      updatedAt: at('2026-03-18T15:00:00.000Z'),
    },
    {
      id: ids.assignments.mathReview,
      groupId: ids.groups.mathLab,
      lessonId: ids.lessons.mathWorkshop,
      title: 'Домашний разбор задач',
      content: 'Подготовить короткое письменное решение трех задач после лаборатории.',
      status: AssignmentStatus.PUBLISHED,
      dueAt: at('2026-03-25T17:00:00.000Z'),
      maxScore: 50,
      publishedAt: at('2026-03-20T11:10:00.000Z'),
      createdByUserId: ids.users.maria,
      createdAt: at('2026-03-20T11:00:00.000Z'),
      updatedAt: at('2026-03-20T11:10:00.000Z'),
    },
    {
      id: ids.assignments.archivedBrief,
      groupId: ids.groups.archivedClub,
      lessonId: ids.lessons.archivedLesson,
      title: 'Архивная проектная заметка',
      content: 'Сохраненное задание из уже закрытого потока.',
      status: AssignmentStatus.ARCHIVED,
      maxScore: 20,
      publishedAt: at('2026-02-20T18:00:00.000Z'),
      archivedAt: at('2026-03-01T12:00:00.000Z'),
      createdByUserId: ids.users.alex,
      createdAt: at('2026-02-20T17:30:00.000Z'),
      updatedAt: at('2026-03-01T12:00:00.000Z'),
    },
  ] satisfies Prisma.AssignmentCreateManyInput[]

  const assignmentFiles = [
    {
      assignmentId: ids.assignments.webHomework,
      fileId: ids.files.webAssignmentBrief,
      sortOrder: 1,
      attachedAt: at('2026-03-16T18:16:00.000Z'),
    },
  ] satisfies Prisma.AssignmentFileCreateManyInput[]

  const submissions = [
    {
      id: ids.submissions.ivanReviewed,
      assignmentId: ids.assignments.webHomework,
      authorId: ids.users.ivan,
      attemptNumber: 1,
      text: 'Прикрепил PDF с версткой и кратким описанием решений по сетке.',
      status: SubmissionStatus.REVIEWED,
      score: 92,
      feedback: 'Хорошая структура и аккуратная сетка, осталось усилить мобильную версию.',
      submittedAt: at('2026-03-20T18:20:00.000Z'),
      reviewedByUserId: ids.users.alex,
      reviewedAt: at('2026-03-21T08:30:00.000Z'),
      createdAt: at('2026-03-20T18:20:00.000Z'),
      updatedAt: at('2026-03-21T08:30:00.000Z'),
    },
    {
      id: ids.submissions.ivanDraft,
      assignmentId: ids.assignments.webHomework,
      authorId: ids.users.ivan,
      attemptNumber: 2,
      text: 'Черновик второй попытки с переработанным hero-блоком.',
      status: SubmissionStatus.DRAFT,
      createdAt: at('2026-03-21T19:00:00.000Z'),
      updatedAt: at('2026-03-21T19:00:00.000Z'),
    },
    {
      id: ids.submissions.sofiaSubmitted,
      assignmentId: ids.assignments.webHomework,
      authorId: ids.users.sofia,
      attemptNumber: 1,
      text: 'Сдала решение вовремя, прошу проверить адаптивность.',
      status: SubmissionStatus.SUBMITTED,
      submittedAt: at('2026-03-22T16:45:00.000Z'),
      createdAt: at('2026-03-22T16:45:00.000Z'),
      updatedAt: at('2026-03-22T16:45:00.000Z'),
    },
  ] satisfies Prisma.SubmissionCreateManyInput[]

  const submissionFiles = [
    {
      submissionId: ids.submissions.ivanReviewed,
      fileId: ids.files.ivanSubmissionPdf,
      sortOrder: 1,
      attachedAt: at('2026-03-20T18:20:00.000Z'),
    },
  ] satisfies Prisma.SubmissionFileCreateManyInput[]

  const scheduleEvents = [
    {
      id: ids.scheduleEvents.webOfficeHours,
      groupId: ids.groups.webBasics,
      title: 'Онлайн office hours',
      description: 'Созвон для разбора вопросов по домашнему заданию.',
      startsAt: at('2026-03-22T17:30:00.000Z'),
      endsAt: at('2026-03-22T18:15:00.000Z'),
      location: 'Zoom',
      status: ScheduleEventStatus.PLANNED,
      createdByUserId: ids.users.alex,
      createdAt: at('2026-03-18T09:00:00.000Z'),
      updatedAt: at('2026-03-18T09:00:00.000Z'),
    },
    {
      id: ids.scheduleEvents.mathConsultation,
      groupId: ids.groups.mathLab,
      title: 'Консультация перед лабораторией',
      description: 'Встреча отменена из-за переноса очного блока.',
      startsAt: at('2026-03-20T13:00:00.000Z'),
      endsAt: at('2026-03-20T13:45:00.000Z'),
      location: 'Кабинет 204',
      status: ScheduleEventStatus.CANCELLED,
      createdByUserId: ids.users.maria,
      cancelledAt: at('2026-03-19T18:30:00.000Z'),
      createdAt: at('2026-03-18T16:00:00.000Z'),
      updatedAt: at('2026-03-19T18:30:00.000Z'),
    },
  ] satisfies Prisma.ScheduleEventCreateManyInput[]

  await prisma.lesson.createMany({ data: lessons })
  await prisma.lessonFile.createMany({ data: lessonFiles })
  await prisma.assignment.createMany({ data: assignments })
  await prisma.assignmentFile.createMany({ data: assignmentFiles })
  await prisma.submission.createMany({ data: submissions })
  await prisma.submissionFile.createMany({ data: submissionFiles })
  await prisma.scheduleEvent.createMany({ data: scheduleEvents })
}

async function seedChats() {
  const lastWebMessageAt = at('2026-03-18T11:06:00.000Z')
  const lastMathMessageAt = at('2026-03-20T11:30:00.000Z')
  const lastDirectMessageAt = at('2026-03-21T07:46:00.000Z')

  const chats = [
    {
      id: ids.chats.webGroup,
      chatType: ChatType.GROUP,
      groupId: ids.groups.webBasics,
      title: 'Общий чат Web Basics',
      createdByUserId: ids.users.alex,
      lastMessageAt: lastWebMessageAt,
      createdAt: at('2026-03-10T08:05:00.000Z'),
      updatedAt: lastWebMessageAt,
    },
    {
      id: ids.chats.mathGroup,
      chatType: ChatType.GROUP,
      groupId: ids.groups.mathLab,
      title: 'Чат Math Lab',
      createdByUserId: ids.users.maria,
      lastMessageAt: lastMathMessageAt,
      createdAt: at('2026-03-11T09:35:00.000Z'),
      updatedAt: lastMathMessageAt,
    },
    {
      id: ids.chats.alexIvanDirect,
      chatType: ChatType.DIRECT,
      directChatKey: buildDirectChatKey(ids.users.alex, ids.users.ivan),
      createdByUserId: ids.users.alex,
      lastMessageAt: lastDirectMessageAt,
      createdAt: at('2026-03-17T07:30:00.000Z'),
      updatedAt: lastDirectMessageAt,
    },
  ] satisfies Prisma.ChatCreateManyInput[]

  const members = [
    {
      chatId: ids.chats.webGroup,
      userId: ids.users.alex,
      joinedAt: at('2026-03-10T08:05:00.000Z'),
      lastReadAt: lastWebMessageAt,
      createdAt: at('2026-03-10T08:05:00.000Z'),
      updatedAt: lastWebMessageAt,
    },
    {
      chatId: ids.chats.webGroup,
      userId: ids.users.ivan,
      joinedAt: at('2026-03-10T08:20:00.000Z'),
      lastReadAt: lastWebMessageAt,
      createdAt: at('2026-03-10T08:20:00.000Z'),
      updatedAt: lastWebMessageAt,
    },
    {
      chatId: ids.chats.webGroup,
      userId: ids.users.sofia,
      joinedAt: at('2026-03-10T08:40:00.000Z'),
      lastReadAt: at('2026-03-18T10:50:00.000Z'),
      createdAt: at('2026-03-10T08:40:00.000Z'),
      updatedAt: at('2026-03-18T10:50:00.000Z'),
    },
    {
      chatId: ids.chats.mathGroup,
      userId: ids.users.maria,
      joinedAt: at('2026-03-11T09:35:00.000Z'),
      lastReadAt: lastMathMessageAt,
      createdAt: at('2026-03-11T09:35:00.000Z'),
      updatedAt: lastMathMessageAt,
    },
    {
      chatId: ids.chats.mathGroup,
      userId: ids.users.alex,
      joinedAt: at('2026-03-12T10:00:00.000Z'),
      lastReadAt: at('2026-03-20T11:00:00.000Z'),
      createdAt: at('2026-03-12T10:00:00.000Z'),
      updatedAt: at('2026-03-20T11:00:00.000Z'),
    },
    {
      chatId: ids.chats.alexIvanDirect,
      userId: ids.users.alex,
      joinedAt: at('2026-03-17T07:30:00.000Z'),
      lastReadAt: lastDirectMessageAt,
      createdAt: at('2026-03-17T07:30:00.000Z'),
      updatedAt: lastDirectMessageAt,
    },
    {
      chatId: ids.chats.alexIvanDirect,
      userId: ids.users.ivan,
      joinedAt: at('2026-03-17T07:30:00.000Z'),
      lastReadAt: lastDirectMessageAt,
      createdAt: at('2026-03-17T07:30:00.000Z'),
      updatedAt: lastDirectMessageAt,
    },
  ] satisfies Prisma.ChatMemberCreateManyInput[]

  const messages = [
    {
      id: ids.messages.webWelcome,
      chatId: ids.chats.webGroup,
      authorId: ids.users.alex,
      text: 'Добро пожаловать в группу. В первом сообщении закрепил материалы к стартовому уроку.',
      createdAt: at('2026-03-18T10:00:00.000Z'),
    },
    {
      id: ids.messages.webAttachment,
      chatId: ids.chats.webGroup,
      authorId: ids.users.ivan,
      editedAt: at('2026-03-18T11:07:00.000Z'),
      createdAt: at('2026-03-18T11:06:00.000Z'),
    },
    {
      id: ids.messages.directCheckIn,
      chatId: ids.chats.alexIvanDirect,
      authorId: ids.users.alex,
      text: 'Проверь, пожалуйста, mobile-версию перед второй попыткой.',
      createdAt: at('2026-03-21T07:40:00.000Z'),
    },
    {
      id: ids.messages.directReply,
      chatId: ids.chats.alexIvanDirect,
      authorId: ids.users.ivan,
      text: 'Уже обновил hero и карточки, сегодня дособеру вторую попытку.',
      createdAt: at('2026-03-21T07:46:00.000Z'),
    },
  ] satisfies Prisma.MessageCreateManyInput[]

  const messageFiles = [
    {
      messageId: ids.messages.webAttachment,
      fileId: ids.files.groupChatAttachment,
      sortOrder: 1,
      attachedAt: at('2026-03-18T11:06:00.000Z'),
    },
  ] satisfies Prisma.MessageFileCreateManyInput[]

  await prisma.$transaction(async (tx) => {
    await tx.chat.createMany({ data: chats })
    await tx.chatMember.createMany({ data: members })
    await tx.message.createMany({ data: messages })
    await tx.messageFile.createMany({ data: messageFiles })
  })
}

async function main() {
  const passwordHash = await hash(seedPassword, 12)

  await resetDatabase()
  await seedUsers(passwordHash)
  await seedFiles()
  await seedGroups()
  await seedLearningContent()
  await seedChats()

  console.info('Seed completed successfully.')
  console.info(`Test users password: ${seedPassword}`)
}

main()
  .catch(async (error) => {
    console.error('Seed failed.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
