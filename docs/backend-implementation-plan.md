# План реализации backend MVP для SmartTeach

## Краткое резюме

Цель: реализовать backend для SmartTeach как `NestJS + Prisma + PostgreSQL + Redis + MinIO` в формате монорепо `apps/*`, синхронизированный с:

- [07-database-structure.md](./07-database-structure.md)
- [openapi.yml](./openapi.yml)

Текущее состояние проекта:

- в репозитории был только frontend на `Vue + Vite`;
- backend-кода, Prisma-схемы, Docker-инфраструктуры и серверных модулей не было;
- backend нужно внедрять как новую часть проекта, а не как доработку существующего сервера.

Целевой результат:

- репозиторий организован как `apps/web` и `apps/api`;
- локальный dev-стек поднимается через Docker Compose;
- реализован REST API по текущему `openapi.yml`;
- реализована локальная авторизация через access/refresh tokens;
- реализованы все таблицы и сценарии из новой структуры БД;
- реализованы групповые и личные чаты с REST + WebSocket realtime;
- backend достаточно подробно структурирован и документирован, чтобы его можно было продолжать без дополнительных архитектурных решений.

## Целевая архитектура

### Формат репозитория

Репозиторий должен быть приведен к монорепо формата:

- `apps/web` — frontend;
- `apps/api` — backend на NestJS;
- `packages/shared` — общие типы, enum-значения, константы и общие контракты без Nest-зависимостей;
- `infra` — docker-compose, инфраструктурные конфиги и init-скрипты;
- `docs` — документация и проектные спецификации.

### Основные технологические решения

- Backend: `NestJS + TypeScript`
- ORM: `Prisma`
- Валидация: `Zod`
- База данных: `PostgreSQL`
- Кэш и служебные realtime-задачи: `Redis`
- Хранение файлов: `MinIO`
- Основной API: `REST`
- Realtime чатов: `WebSocket`
- Авторизация: `JWT access token` через `Bearer`, `refresh token` через body
- Документация API: `Swagger` обязателен

### Формат backend-приложения

В `apps/api` должен быть один модульный backend-монолит без микросервисов.

Целевые модули:

- `system`
- `auth`
- `users`
- `files`
- `groups`
- `group-settings`
- `group-members`
- `join-requests`
- `lessons`
- `assignments`
- `submissions`
- `schedule`
- `chats`
- `ws-chat`

Инфраструктурные модули:

- `config`
- `database/prisma`
- `cache/redis`
- `storage/minio`
- `security`
- `common`

## Пошаговый план реализации

### 1. Подготовка монорепо и dev-инфраструктуры

1. Перевести frontend в `apps/web` без изменения логики.
2. Создать `apps/api` как новое NestJS-приложение.
3. Обновить корневой `package.json` под workspace-структуру.
4. Добавить корневые scripts:
   - `dev`
   - `dev:web`
   - `dev:api`
   - `build`
   - `build:web`
   - `build:api`
   - `db:migrate`
   - `db:seed`
   - `prisma:generate`
5. Настроить общий `tsconfig` для монорепо и отдельные `tsconfig` для `apps/web` и `apps/api`.
6. Добавить `.env.example` для backend.
7. Добавить Docker Compose с сервисами:
   - `postgres`
   - `redis`
   - `minio`
8. Добавить init-логику для создания bucket в MinIO.
9. Зафиксировать README по запуску backend и dev-окружения.

### 2. Базовый каркас NestJS

1. Создать bootstrap для `apps/api`.
2. Подключить:
   - `ConfigModule`
   - глобальную валидацию
   - глобальный exception filter
   - единый формат ошибок
   - `SwaggerModule`
   - `Helmet`
   - `CORS`
   - request logging
3. Реализовать `/health`.
4. Настроить API versioning через `/api/v1`.
5. Создать инфраструктурные сервисы:
   - `PrismaService`
   - `RedisService`
   - `MinioService`
   - `PasswordHashService`
   - `TokenService`
   - `CodeGeneratorService`
6. Добавить строгую валидацию env-конфига.

### 3. Prisma schema, миграции и seed

1. Создать Prisma schema по [07-database-structure.md](./07-database-structure.md).
2. Зафиксировать enum:
   - `GroupAccessMode`
   - `GroupStatus`
   - `GroupRole`
   - `JoinRequestStatus`
   - `LessonStatus`
   - `AssignmentStatus`
   - `SubmissionStatus`
   - `ScheduleEventStatus`
   - `ChatType`
3. Описать модели:
   - `User`
   - `Session`
   - `File`
   - `Group`
   - `GroupSettings`
   - `GroupMember`
   - `GroupJoinRequest`
   - `Lesson`
   - `LessonFile`
   - `Assignment`
   - `AssignmentFile`
   - `Submission`
   - `SubmissionFile`
   - `ScheduleEvent`
   - `Chat`
   - `ChatMember`
   - `Message`
   - `MessageFile`
4. Добавить ограничения и индексы из документа по БД.
5. Создать первую миграцию.
6. Реализовать seed с тестовыми пользователями, группами, уроками, заданиями и чатами.

### 4. Auth и users

#### Auth

Реализовать endpoint:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Требования:

- пароль хранится только как hash;
- `refresh token` хранится только как hash в `sessions`;
- login создает новую запись сессии;
- refresh проверяет `expires_at` и `revoked_at`;
- logout отзывает текущую сессию;
- access token короткоживущий;
- refresh token долгоживущий;
- в ответе возвращается `sessionId`.

#### Users

Реализовать endpoint:

- `PATCH /users/me`
- `GET /users/{userId}`

Требования:

- разделить внутренний `User` и публичный `PublicUser`;
- не отдавать внутренние поля пользователя;
- поддерживать обновление `displayName`, `bio`, `avatarFileId`.

### 5. Files и MinIO

Реализовать endpoint:

- `POST /files`
- `GET /files/{fileId}`
- `DELETE /files/{fileId}`

Требования:

- файл загружается в MinIO;
- в БД сохраняются только метаданные;
- `storage_key` генерируется сервером;
- `DELETE` делает мягкое удаление;
- файлы потом переиспользуются для:
  - аватаров,
  - уроков,
  - заданий,
  - сдач,
  - сообщений.

### 6. Groups и group-settings

#### Groups

Реализовать endpoint:

- `GET /groups`
- `POST /groups`
- `GET /groups/by-code/{code}`
- `GET /groups/{groupId}`
- `PATCH /groups/{groupId}`
- `DELETE /groups/{groupId}`

Требования:

- при создании группы создаются:
  - `groups`
  - `group_settings`
  - запись owner в `group_members`
- `code` генерируется автоматически;
- `DELETE` переводит группу в `DELETED` и заполняет `deleted_at`;
- обычное редактирование не должно напрямую ставить `DELETED`.

#### Group settings

Реализовать endpoint:

- `GET /groups/{groupId}/settings`
- `PATCH /groups/{groupId}/settings`

Требования:

- управляются флаги:
  - `chatEnabled`
  - `lessonsEnabled`
  - `assignmentsEnabled`
  - `scheduleEnabled`
- изменять настройки могут только `OWNER` и `ADMIN`;
- остальные модули обязаны проверять доступность функции через `group_settings`.

### 7. Участники и заявки на вступление

#### Group members

Реализовать endpoint:

- `POST /groups/{groupId}/join`
- `POST /groups/{groupId}/leave`
- `GET /groups/{groupId}/members`
- `POST /groups/{groupId}/members`
- `PATCH /groups/{groupId}/members/{userId}`
- `DELETE /groups/{groupId}/members/{userId}`

Требования:

- `join` работает только для `OPEN`;
- ручное добавление используется для `CLOSED` и admin flow;
- список участников доступен участникам группы;
- изменение ролей и удаление доступны `OWNER/ADMIN`;
- нельзя удалить единственного owner;
- owner не может покинуть группу без передачи владения.

#### Join requests

Реализовать endpoint:

- `GET /groups/{groupId}/join-requests`
- `POST /groups/{groupId}/join-requests`
- `PATCH /groups/{groupId}/join-requests/{requestId}`

Требования:

- заявки создаются только для `BY_REQUEST`;
- для `OPEN` используется обычный `join`;
- для `CLOSED` пользователь не может подать заявку сам;
- нельзя создать вторую активную `PENDING` заявку;
- при `APPROVED` в транзакции создается `group_members`;
- при `REJECTED` обновляется только статус заявки.

### 8. Lessons

Реализовать endpoint:

- `GET /groups/{groupId}/lessons`
- `POST /groups/{groupId}/lessons`
- `GET /groups/{groupId}/lessons/{lessonId}`
- `PATCH /groups/{groupId}/lessons/{lessonId}`

Требования:

- модуль работает только при `lessons_enabled = true`;
- урок принадлежит конкретной группе;
- поддерживаются статусы:
  - `DRAFT`
  - `PUBLISHED`
  - `ARCHIVED`
- `publishedAt` и `archivedAt` заполняются по переходам статусов;
- `sortOrder` управляет отображением;
- `fileIds` синхронизируют `lesson_files`.

### 9. Assignments и submissions

#### Assignments

Реализовать endpoint:

- `GET /groups/{groupId}/assignments`
- `POST /groups/{groupId}/assignments`
- `GET /groups/{groupId}/assignments/{assignmentId}`
- `PATCH /groups/{groupId}/assignments/{assignmentId}`

Требования:

- модуль работает только при `assignments_enabled = true`;
- `lessonId` опционален;
- если `lessonId` задан, урок должен быть из той же группы;
- `fileIds` синхронизируют `assignment_files`;
- поддерживаются статусы:
  - `DRAFT`
  - `PUBLISHED`
  - `ARCHIVED`

#### Submissions

Реализовать endpoint:

- `GET /groups/{groupId}/assignments/{assignmentId}/submissions`
- `POST /groups/{groupId}/assignments/{assignmentId}/submissions`
- `GET /groups/{groupId}/assignments/{assignmentId}/submissions/{submissionId}`
- `PATCH /groups/{groupId}/assignments/{assignmentId}/submissions/{submissionId}`

Требования:

- у одного пользователя может быть несколько попыток;
- новая попытка получает следующий `attemptNumber`;
- в ответе хранится текущий результат по попытке, без истории изменений проверки;
- `fileIds` синхронизируют `submission_files`;
- обычный пользователь видит свои submissions;
- `OWNER/ADMIN` видят все submissions по заданию;
- проверка работы выставляет:
  - `score`
  - `feedback`
  - `reviewedAt`
  - `reviewedByUserId`

### 10. Schedule

Реализовать endpoint:

- `GET /groups/{groupId}/schedule`
- `GET /groups/{groupId}/schedule/events`
- `POST /groups/{groupId}/schedule/events`
- `GET /groups/{groupId}/schedule/events/{eventId}`
- `PATCH /groups/{groupId}/schedule/events/{eventId}`
- `DELETE /groups/{groupId}/schedule/events/{eventId}`

Требования:

- `/schedule` возвращает единый агрегированный feed:
  - уроки с датами,
  - дедлайны заданий,
  - кастомные события;
- кастомные события существуют в `schedule_events`;
- модуль работает только при `schedule_enabled = true`;
- все записи должны приводиться к единой DTO `ScheduleEntry`.

### 11. Chats и messages

#### Group chats

Реализовать endpoint:

- `GET /groups/{groupId}/chats`
- `POST /groups/{groupId}/chats`
- `PATCH /groups/{groupId}/chats/{chatId}`
- `DELETE /groups/{groupId}/chats/{chatId}`

Требования:

- работают только при `chat_enabled = true`;
- доступны только участникам группы;
- создание и изменение доступны `OWNER/ADMIN`.

#### Direct chats

Реализовать endpoint:

- `GET /chats`
- `POST /chats/direct`
- `GET /chats/{chatId}`

Требования:

- direct chat только `1 на 1`;
- при создании использовать `direct_chat_key`, чтобы не было дублей;
- direct chat создается или возвращается, если уже существует.

#### Messages

Реализовать endpoint:

- `GET /chats/{chatId}/messages`
- `POST /chats/{chatId}/messages`
- `PATCH /chats/{chatId}/messages/{messageId}`
- `DELETE /chats/{chatId}/messages/{messageId}`

Требования:

- сообщение должно содержать текст или хотя бы одно вложение;
- `fileIds` синхронизируют `message_files`;
- удаление мягкое через `deleted_at`;
- после создания сообщения обновляется `last_message_at` у чата;
- редактирование доступно автору;
- удаление доступно автору и администраторам группы для групповых чатов.

### 12. WebSocket для чатов

Реализовать `ChatGateway` внутри backend.

Функции MVP:

- подключение по JWT;
- подписка на `chatId`;
- доставка realtime-событий чата;
- работа поверх REST, а не вместо REST.

События MVP:

- `chat.message.created`
- `chat.message.updated`
- `chat.message.deleted`
- `chat.read.updated`, если обновление `lastReadAt` будет реализовано через WS

Не делать в MVP:

- typing indicator;
- online presence;
- delivery status;
- read receipts по каждому сообщению.

### 13. Swagger и контрактная дисциплина

1. Подключить Swagger в Nest.
2. Все DTO и ответы должны совпадать с [openapi.yml](./openapi.yml).
3. Вести спецификацию синхронно с runtime Swagger.
4. Для каждого endpoint обеспечить:
   - controller
   - service
   - validation
   - guards/permissions
   - Swagger annotations
   - e2e tests

### 14. Безопасность и права доступа

Реализовать единый слой authorization logic.

Проверки:

- авторизация пользователя;
- membership в группе;
- role в группе;
- ownership сообщения или submission;
- доступность модуля по `group_settings`;
- статус группы `ACTIVE / ARCHIVED / DELETED`.

Правила:

- в `DELETED` группе обычные действия недоступны;
- в `ARCHIVED` группе чтение разрешено, запись ограничена;
- загрузка файлов доступна только авторизованным пользователям;
- нельзя привязывать файл к сущности без права на ее изменение.

### 15. Транзакции и инварианты

Все составные бизнес-сценарии должны выполняться в транзакциях:

- создание группы;
- approve join request;
- создание direct chat;
- создание submission с попыткой;
- обновление file links у lesson/assignment/submission/message.

Необходимые инварианты:

- owner из `groups.owner_id` существует в `group_members` как `OWNER`;
- в одной группе только один `OWNER`;
- только одна активная `PENDING` заявка на пользователя и группу;
- direct chat между двумя пользователями не дублируется;
- `attempt_number` уникален в рамках пары `assignment_id + author_id`.

### 16. Тестирование

#### Unit tests

Покрыть unit-тестами:

- генерацию `groups.code`;
- генерацию `direct_chat_key`;
- auth token flow;
- расчет `attemptNumber`;
- state transitions;
- permission services / policies.

#### Integration / e2e tests

Покрыть e2e:

1. регистрация;
2. логин;
3. refresh;
4. logout;
5. создание группы;
6. создание `group_settings`;
7. добавление owner в `group_members`;
8. вступление в `OPEN`;
9. заявка в `BY_REQUEST`;
10. approve/reject join request;
11. ручное добавление в `CLOSED`;
12. изменение роли;
13. создание урока;
14. обновление lesson files;
15. создание задания;
16. привязка задания к уроку;
17. создание нескольких submissions;
18. корректный `attemptNumber`;
19. проверка submission;
20. агрегированное расписание;
21. создание group chat;
22. создание direct chat без дублей;
23. отправка сообщения с текстом;
24. отправка сообщения только с файлами;
25. мягкое удаление сообщения;
26. WS-доставка нового сообщения.

#### Smoke test

Подготовить ручной smoke-сценарий:

- поднять Docker Compose;
- применить миграции;
- выполнить seed;
- открыть Swagger;
- вручную пройти основные сценарии.

## Публичные API и контракты, которые обязательны к реализации

Обязательные для реализации элементы:

- все endpoint из [openapi.yml](./openapi.yml);
- все enum и схемы из `components.schemas`;
- все path/query параметры из `components.parameters`;
- форматы:
  - `AuthSession`
  - `TokenPair`
  - `Group`
  - `GroupSettings`
  - `GroupMember`
  - `GroupJoinRequest`
  - `Lesson`
  - `Assignment`
  - `Submission`
  - `ScheduleEntry`
  - `ScheduleEvent`
  - `Chat`
  - `Message`

## Порядок реализации

Работу выполнять в следующем порядке:

1. монорепо и локальная инфраструктура;
2. Nest bootstrap и infrastructural services;
3. Prisma schema, миграции, seed;
4. auth;
5. users;
6. files;
7. groups + group_settings;
8. group_members + join_requests;
9. lessons;
10. assignments;
11. submissions;
12. schedule;
13. chats REST;
14. WebSocket gateway;
15. Swagger sync и e2e tests;
16. финальная ручная проверка.

## Критерии готовности backend MVP

Backend считается готовым, если:

- локально поднимается через Docker Compose;
- миграции применяются без ручных исправлений;
- seed отрабатывает успешно;
- Swagger поднимается и совпадает с OpenAPI;
- все endpoint из `openapi.yml` реализованы;
- основные сценарии покрыты e2e-тестами;
- чат работает через REST + WebSocket;
- работают вложения для avatar, lessons, assignments, submissions, messages;
- права доступа корректно ограничивают обычного пользователя;
- агрегированное расписание собирает lessons, deadlines и custom events в один feed.

## Допущения, зафиксированные в плане

- backend будет жить в этом же репозитории;
- структура репозитория — монорепо `apps/*`;
- package manager — `npm`;
- auth — `Bearer access token + refresh token в body`;
- realtime в MVP ограничен только чатовыми событиями;
- Swagger обязателен;
- ручное добавление участника в закрытую группу идет через `POST /groups/{groupId}/members`;
- единый календарный feed идет через `GET /groups/{groupId}/schedule`;
- soft delete применяется для `groups`, `files`, `messages`;
- `ARCHIVED` группа доступна на чтение, но ограничена на запись;
- direct chats только `1 на 1`.
