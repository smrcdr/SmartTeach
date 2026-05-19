# Backend smoke test

Ручной smoke-сценарий для текущего backend в `apps/api`.

## 1. Подготовка окружения

1. Установить зависимости:
   - `npm install`
2. Поднять инфраструктуру:
   - `docker compose -f infra/docker-compose.yml up -d`
3. Применить миграции и seed:
   - `npm run db:migrate`
   - `npm run db:seed`
4. Запустить API:
   - `npm run dev:api`

## 2. Базовые проверки

1. Проверить health:
   - `GET http://localhost:3000/api/v1/health`
2. Открыть Swagger UI:
   - `http://localhost:3000/api/docs`

## 3. Auth flow

1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login`
3. `GET /api/v1/auth/me`
4. `POST /api/v1/auth/refresh`
5. `POST /api/v1/auth/logout`

## 4. Пользователь и файлы

1. `PATCH /api/v1/users/me`
2. `GET /api/v1/users/{userId}`
3. `POST /api/v1/files`
4. `GET /api/v1/files/{fileId}`
5. `DELETE /api/v1/files/{fileId}`

## 5. Группы и доступ

1. `GET /api/v1/groups`
2. `POST /api/v1/groups`
3. `GET /api/v1/groups/by-code/{code}`
4. `GET /api/v1/groups/{groupId}`
5. `PATCH /api/v1/groups/{groupId}`
6. `GET /api/v1/groups/{groupId}/settings`
7. `PATCH /api/v1/groups/{groupId}/settings`
8. `DELETE /api/v1/groups/{groupId}`

Проверить отдельно три сценария доступа:

- `OPEN` -> `POST /api/v1/groups/{groupId}/join`
- `BY_REQUEST` -> `POST /api/v1/groups/{groupId}/join-requests`
- `CLOSED` -> ручное добавление через `POST /api/v1/groups/{groupId}/members`

## 6. Участники, заявки и полезные ссылки

1. `GET /api/v1/groups/{groupId}/members`
2. `POST /api/v1/groups/{groupId}/members`
3. `PATCH /api/v1/groups/{groupId}/members/{userId}`
4. `DELETE /api/v1/groups/{groupId}/members/{userId}`
5. `POST /api/v1/groups/{groupId}/leave`
6. `GET /api/v1/groups/{groupId}/join-requests`
7. `PATCH /api/v1/groups/{groupId}/join-requests/{requestId}`
8. `GET /api/v1/groups/{groupId}/useful-links`
9. `POST /api/v1/groups/{groupId}/useful-links`

## 7. Материалы и уроки

1. `GET /api/v1/groups/{groupId}/materials`
2. `POST /api/v1/groups/{groupId}/materials/sections`
3. `PATCH /api/v1/groups/{groupId}/materials/sections/{sectionId}`
4. `DELETE /api/v1/groups/{groupId}/materials/sections/{sectionId}`
5. `POST /api/v1/groups/{groupId}/materials/sections/{sectionId}/subsections`
6. `PATCH /api/v1/groups/{groupId}/materials/subsections/{subsectionId}`
7. `DELETE /api/v1/groups/{groupId}/materials/subsections/{subsectionId}`
8. `GET /api/v1/groups/{groupId}/materials/subsections/{subsectionId}`
9. `GET /api/v1/groups/{groupId}/lessons`
10. `POST /api/v1/groups/{groupId}/lessons`
11. `GET /api/v1/groups/{groupId}/lessons/{lessonId}`
12. `PATCH /api/v1/groups/{groupId}/lessons/{lessonId}`
13. `DELETE /api/v1/groups/{groupId}/lessons/{lessonId}`

## 8. Задания и сдачи

1. `GET /api/v1/groups/{groupId}/assignments`
2. `POST /api/v1/groups/{groupId}/assignments`
3. `GET /api/v1/groups/{groupId}/assignments/{assignmentId}`
4. `PATCH /api/v1/groups/{groupId}/assignments/{assignmentId}`
5. `GET /api/v1/groups/{groupId}/assignments/{assignmentId}/submissions`
6. `POST /api/v1/groups/{groupId}/assignments/{assignmentId}/submissions`
7. `GET /api/v1/groups/{groupId}/assignments/{assignmentId}/submissions/{submissionId}`
8. `PATCH /api/v1/groups/{groupId}/assignments/{assignmentId}/submissions/{submissionId}`

Нужно проверить минимум два сценария:

- участник создает или отправляет сдачу
- администратор или преподаватель проверяет сдачу и выставляет результат

## 9. Расписание

1. `GET /api/v1/groups/{groupId}/schedule`
2. `GET /api/v1/groups/{groupId}/schedule/events`
3. `POST /api/v1/groups/{groupId}/schedule/events`
4. `GET /api/v1/groups/{groupId}/schedule/events/{eventId}`
5. `PATCH /api/v1/groups/{groupId}/schedule/events/{eventId}`
6. `DELETE /api/v1/groups/{groupId}/schedule/events/{eventId}`

Проверить оба типа событий:

- `SPECIAL`
- `WEEKLY`

## 10. Чаты

1. `GET /api/v1/chats`
2. `POST /api/v1/chats/direct`
3. `GET /api/v1/chats/{chatId}`
4. `GET /api/v1/chats/{chatId}/messages`
5. `POST /api/v1/chats/{chatId}/messages`
6. `PATCH /api/v1/chats/{chatId}/messages/{messageId}`
7. `DELETE /api/v1/chats/{chatId}/messages/{messageId}`
8. `GET /api/v1/groups/{groupId}/chats`
9. `POST /api/v1/groups/{groupId}/chats`
10. `PATCH /api/v1/groups/{groupId}/chats/{chatId}`
11. `DELETE /api/v1/groups/{groupId}/chats/{chatId}`

## 11. Realtime для сообщений

1. Подключить клиента к `Socket.IO`
2. Открыть чат
3. Отправить сообщение через `POST /api/v1/chats/{chatId}/messages`
4. Убедиться, что второе подключение получает событие нового сообщения без перезагрузки

## 12. Что считать успешным smoke-тестом

Smoke считается успешным, если:

- API отвечает по health-check
- auth flow работает от регистрации до logout
- создается группа и доступны все базовые модули
- материалы, задания, расписание и чаты проходят хотя бы один полный позитивный сценарий
- realtime-сообщения доходят до второго клиента
