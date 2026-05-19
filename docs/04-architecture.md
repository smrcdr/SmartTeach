# 4. Архитектура системы

## Формат репозитория

SmartTeach - это `npm workspace` монорепозиторий.

- `apps/web` - клиентское приложение
- `apps/api` - backend API
- `packages/shared` - общие зависимости и контракты без привязки к одному приложению
- `docs` - проектная и техническая документация

## Frontend

Технологический стек frontend:

- `Vue 3`
- `Vue Router`
- `Pinia`
- `Vite`
- `socket.io-client`

Frontend организован как `SPA` с тремя основными слоями навигации:

- публичные страницы
- общий `AppShell`
- рабочее пространство конкретной группы

## Backend

Технологический стек backend:

- `NestJS`
- `TypeScript`
- `Prisma`
- `PostgreSQL`
- `Redis`
- `MinIO`
- `Swagger`
- `Socket.IO`
- `Zod`

Приложение поднимается как модульный монолит. В `main.ts` настроены:

- глобальный префикс `api`
- URI-versioning с версией `v1`
- `helmet`
- `cookie-parser`
- `CORS`
- глобальный `ZodValidationPipe`
- глобальный `AllExceptionsFilter`
- `Swagger UI` по пути `/api/docs`

## Модульная структура backend

Предметные модули:

- `system`
- `auth`
- `users`
- `files`
- `groups`
- `group-settings`
- `group-useful-links`
- `group-members`
- `join-requests`
- `materials`
- `lessons`
- `assignments`
- `schedule`
- `chats`

Инфраструктурные модули и слои:

- `config`
- `common`
- `prisma`
- `redis`
- `minio`
- `security`

## Доменная модель

Система строится вокруг группы. Группа объединяет:

- владельца и участников
- настройки включенных модулей
- полезные ссылки
- материалы и уроки
- задания и сдачи
- расписание
- групповые чаты

Отдельной доменной сущности `курс` или `класс` в архитектуре нет. Поведение настраивается через поля группы и `group_settings`.

## Авторизация и сессии

Текущая схема авторизации:

- `access token` используется для запросов к API
- `refresh token` продлевает сессию
- сервер хранит запись сессии в таблице `sessions`
- endpoint'ы авторизации находятся под `/api/v1/auth/*`

Это серверная модель сессии поверх JWT, а не чисто stateless-схема.

## Работа с файлами

- бинарные данные файлов хранятся в `MinIO`
- метаданные файлов хранятся в таблице `files`
- другие модули ссылаются на файл по `fileId`

## Realtime

Для чатов используются два слоя:

- `REST API` для списка чатов, истории сообщений и CRUD-операций
- `Socket.IO gateway` для realtime-событий

## Источники актуальных контрактов

- REST-контракт: [openapi.yml](openapi.yml)
- схема данных: [07-database-structure.md](07-database-structure.md) и `apps/api/prisma/schema.prisma`
- frontend-маршруты: `apps/web/src/app/router/routes.ts`
