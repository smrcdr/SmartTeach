# 7. Структура базы данных

Полным источником истины для схемы данных остается `apps/api/prisma/schema.prisma`. Этот документ нужен как актуальный обзор доменной модели без устаревших сущностей и предположений.

## Общие принципы

- база данных: `PostgreSQL`
- слой доступа к данным: `Prisma`
- основные идентификаторы: `UUID`
- все ключевые сущности используют временные поля создания и обновления
- для файлов хранятся метаданные, а сами бинарные данные лежат в `MinIO`
- мягкое удаление используется как минимум для файлов, групп и сообщений

## Перечень enum'ов

- `GroupAccessMode`: `OPEN`, `BY_REQUEST`, `CLOSED`
- `GroupStatus`: `ACTIVE`, `ARCHIVED`, `DELETED`
- `GroupRole`: `OWNER`, `ADMIN`, `USER`
- `JoinRequestStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `LessonStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `AssignmentStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `SubmissionStatus`: `DRAFT`, `SUBMITTED`, `REVIEWED`
- `ScheduleEventStatus`: `PLANNED`, `CANCELLED`
- `ScheduleEventType`: `SPECIAL`, `WEEKLY`
- `ChatType`: `GROUP`, `DIRECT`

## 1. Пользователи, сессии и файлы

### `User`

Хранит аккаунт пользователя.

Ключевые поля:

- `email`
- `passwordHash`
- `displayName`
- `bio`
- `avatarFileId`

Связи:

- сессии авторизации
- загруженные файлы
- владение группами
- членство в группах
- заявки на вступление
- созданные уроки, задания, события, чаты и полезные ссылки

### `Session`

Хранит серверную сессию для `refresh token`.

Ключевые поля:

- `userId`
- `refreshTokenHash`
- `userAgent`
- `ipAddress`
- `lastUsedAt`
- `expiresAt`
- `revokedAt`

### `File`

Единая таблица метаданных файлов.

Ключевые поля:

- `storageKey`
- `originalName`
- `mimeType`
- `sizeBytes`
- `uploadedByUserId`
- `deletedAt`

Файл может использоваться как:

- аватар пользователя
- аватар группы
- изображение карточки группы
- изображение полезной ссылки
- вложение урока
- вложение задания
- вложение сдачи
- вложение сообщения

## 2. Группы и доступ

### `Group`

Центральная сущность системы.

Ключевые поля:

- `code` - короткий публичный код группы
- `name`
- `description`
- `ownerId`
- `avatarFileId`
- `catalogImageFileId`
- `accessMode`
- `status`
- `archivedAt`
- `deletedAt`

Связи:

- настройки группы
- участники
- заявки на вступление
- полезные ссылки
- материалы и подсекции
- уроки
- задания
- события расписания
- групповые чаты

### `GroupSettings`

Таблица `1:1` с группой.

Флаги:

- `chatEnabled`
- `lessonsEnabled`
- `assignmentsEnabled`
- `scheduleEnabled`
- `scheduleWeeklyEnabled`
- `scheduleSpecialEnabled`
- `usefulLinksEnabled`

### `GroupMember`

Таблица участия пользователей в группе.

Ключевые поля:

- `groupId`
- `userId`
- `role`
- `joinedAt`

Особенности:

- составной первичный ключ: `groupId + userId`
- роли ограничены значениями `OWNER`, `ADMIN`, `USER`

### `GroupJoinRequest`

Заявка пользователя на вступление в группу.

Ключевые поля:

- `groupId`
- `userId`
- `status`
- `reviewedByUserId`
- `reviewedAt`

### `GroupUsefulLink`

Полезная ссылка, которая отображается в группе.

Ключевые поля:

- `groupId`
- `title`
- `url`
- `imageFileId`
- `sortOrder`
- `createdByUserId`

## 3. Материалы и уроки

### `MaterialSection`

Верхний уровень иерархии материалов группы.

Ключевые поля:

- `groupId`
- `title`
- `sortOrder`
- `createdByUserId`

### `MaterialSubsection`

Подраздел внутри секции материалов.

Ключевые поля:

- `groupId`
- `sectionId`
- `title`
- `sortOrder`
- `createdByUserId`

Связи:

- принадлежит секции
- содержит уроки
- может использоваться как цель задания

### `Lesson`

Учебная единица внутри группы.

Ключевые поля:

- `groupId`
- `materialSubsectionId`
- `title`
- `content`
- `status`
- `sortOrder`
- `publishedAt`
- `archivedAt`
- `createdByUserId`

Особенности:

- урок может быть не привязан к подсекции
- один урок может иметь несколько вложенных файлов через `LessonFile`

### `LessonFile`

Связка урока и файла.

Ключевые поля:

- `lessonId`
- `fileId`
- `sortOrder`

## 4. Задания и сдачи

### `Assignment`

Задание внутри группы.

Ключевые поля:

- `groupId`
- `title`
- `content`
- `status`
- `dueAt`
- `maxScore`
- `publishedAt`
- `archivedAt`
- `createdByUserId`

Связи:

- вложения через `AssignmentFile`
- цели по урокам через `AssignmentLessonTarget`
- цели по секциям через `AssignmentMaterialSectionTarget`
- цели по подсекциям через `AssignmentMaterialSubsectionTarget`
- сдачи пользователей

### `AssignmentLessonTarget`

Связывает задание с уроком.

### `AssignmentMaterialSectionTarget`

Связывает задание с секцией материалов.

### `AssignmentMaterialSubsectionTarget`

Связывает задание с подсекцией материалов.

### `AssignmentFile`

Связка задания и файла.

Ключевые поля:

- `assignmentId`
- `fileId`
- `sortOrder`

### `Submission`

Сдача задания пользователем.

Ключевые поля:

- `assignmentId`
- `authorId`
- `attemptNumber`
- `text`
- `status`
- `score`
- `feedback`
- `submittedAt`
- `reviewedByUserId`
- `reviewedAt`

Особенности:

- для одного задания у пользователя может быть несколько попыток
- уникальность: `assignmentId + authorId + attemptNumber`

### `SubmissionFile`

Связка сдачи и файла.

Ключевые поля:

- `submissionId`
- `fileId`
- `sortOrder`

## 5. Расписание

### `ScheduleEvent`

Отдельное событие расписания группы.

Ключевые поля:

- `groupId`
- `title`
- `description`
- `eventType`
- `startsAt`
- `endsAt`
- `weekday`
- `startMinutes`
- `endMinutes`
- `location`
- `status`
- `createdByUserId`
- `cancelledAt`

Особенности:

- `SPECIAL` используется для разового события
- `WEEKLY` используется для повторяющегося недельного события
- недельные события дополнительно используют `weekday`, `startMinutes`, `endMinutes`

## 6. Чаты и сообщения

### `Chat`

Единая таблица для групповых и личных чатов.

Ключевые поля:

- `chatType`
- `groupId`
- `title`
- `directChatKey`
- `createdByUserId`
- `lastMessageAt`

Особенности:

- `GROUP`-чат связан с группой
- `DIRECT`-чат не связан с группой и использует уникальный `directChatKey`

### `ChatMember`

Участник чата.

Ключевые поля:

- `chatId`
- `userId`
- `joinedAt`
- `lastReadAt`

Особенности:

- составной первичный ключ: `chatId + userId`

### `Message`

Сообщение внутри чата.

Ключевые поля:

- `chatId`
- `authorId`
- `replyToMessageId`
- `text`
- `editedAt`
- `deletedAt`
- `createdAt`

Особенности:

- поддерживаются ответы на сообщения через self-reference
- сообщение может иметь вложения через `MessageFile`

### `MessageFile`

Связка сообщения и файла.

Ключевые поля:

- `messageId`
- `fileId`
- `sortOrder`

## Практическое правило

Если в этом документе и `schema.prisma` есть расхождение, приоритет всегда у `apps/api/prisma/schema.prisma`.
