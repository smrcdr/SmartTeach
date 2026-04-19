# Подробный план реализации frontend MVP

## Назначение документа

Этот документ нужен как execution-план для агента, который раньше не работал с SmartTeach.

Задача документа:

- дать минимальный набор контекста для входа в проект;
- показать точный порядок реализации;
- указать, какие файлы читать и менять на каждом этапе;
- зафиксировать, что считается завершением шага;
- дать способ проверить выполнение каждого шага.

Этот документ не заменяет продуктовую спецификацию. Перед началом работы обязательно прочитать [frontend-mvp-spec.md](./frontend-mvp-spec.md).

## Как пользоваться этим планом

Если агент реализует проект:

1. Прочитать разделы `Быстрый старт`, `Исходный контекст` и `Жёсткие правила`.
2. Выполнять шаги строго по порядку.
3. Не переходить к следующему шагу, пока не выполнены критерии завершения текущего.
4. Если шаг упирается в неустранённый backend gap, остановиться и явно зафиксировать blocker.

Если агент проверяет проект:

1. Взять номер шага.
2. Сверить ожидаемые файлы, поведение и команды проверки.
3. Отметить шаг как завершённый только если выполнены все критерии из раздела `Как проверить`.

## Быстрый старт для нового агента

### Обязательные файлы для чтения

Прочитать до начала работы:

- [AGENTS.md](/home/smarer/coding/SmarTeach/AGENTS.md)
- [README.md](/home/smarer/coding/SmarTeach/README.md)
- [frontend-mvp-spec.md](/home/smarer/coding/SmarTeach/spec/frontend-mvp-spec.md)
- [openapi.yml](/home/smarer/coding/SmarTeach/apps/web/public/openapi.yml)

При неясностях по backend смотреть:

- `apps/api/src/modules/auth/**`
- `apps/api/src/modules/groups/**`
- `apps/api/src/modules/group-members/**`
- `apps/api/src/modules/lessons/**`
- `apps/api/src/modules/assignments/**`
- `apps/api/src/modules/schedule/**`
- `apps/api/src/modules/chats/**`
- `apps/api/src/modules/files/**`
- `apps/api/src/modules/users/**`

### Текущее состояние репозитория

На момент старта:

- `apps/web` — очень тонкий Vue-проект с `vue` и `vue-router`;
- текущие страницы в `apps/web/src/pages` — моковые и не отражают реальный API;
- `apps/web/src/data/mockDashboard.ts` и часть компонентов завязаны на старую вымышленную модель;
- `apps/api` уже содержит рабочие доменные модули и `openapi.yml`;
- auth backend всё ещё работает по старому контракту с `refreshToken` в body и должен быть изменён.

### Команды проекта

Основные команды из корня репозитория:

- `npm install`
- `npm run dev`
- `npm run dev:web`
- `npm run dev:api`
- `npm run build`
- `npm run build:web`
- `npm run build:api`
- `npm run test:api`
- `npm run openapi:generate`
- `npm run db:migrate`
- `npm run db:seed`

## Исходный контекст

### Репозиторий

- frontend: `apps/web`
- backend: `apps/api`
- общие пакеты: `packages/shared`
- старые docs: `docs`
- новая продуктовая спека: `spec/frontend-mvp-spec.md`

### Seed-данные для ручной проверки

Файл: [seed.ts](/home/smarer/coding/SmarTeach/apps/api/prisma/seed.ts)

Общий пароль для seed-пользователей:

- `Password123!`

Пользователи:

- `alex.teacher@smarteach.local`
- `maria.mentor@smarteach.local`
- `ivan.student@smarteach.local`
- `sofia.student@smarteach.local`
- `nina.observer@smarteach.local`

Ключевые seed-группы:

- `WEBSPRING26` — `OPEN`, `ACTIVE`
- `MATHLAB26` — `BY_REQUEST`, `ACTIVE`
- `ARCHIVE26` — `CLOSED`, `ARCHIVED`

Использовать эти данные для ручной проверки сценариев `OPEN`, `BY_REQUEST`, `ARCHIVED`, ролей и чатов.

## Жёсткие правила

Эти правила обязательны на всех этапах:

1. Источник истины для frontend-поведения — реальный backend API, а не старые мок-экраны.
2. В UI не должно остаться сущностей `course` и `class`.
3. В UI нельзя оставлять поля, которых нет в API, только ради декоративности.
4. В финальной реализации не должно быть зависимости от `mockDashboard.ts` и аналогичных mock-источников.
5. Все auth-запросы, связанные с cookie, должны отправляться с `credentials: 'include'`.
6. `accessToken` хранится только в памяти клиента.
7. `refreshToken` живёт только в `httpOnly cookie`.
8. Frontend нельзя строить на старом `openapi.yml`, если auth-контракт ещё не обновлён.

## Рекомендуемый технический стек

### Frontend зависимости

Нужно добавить в `apps/web`:

runtime dependencies:

- `pinia`
- `@tanstack/vue-query`
- `openapi-fetch`
- `socket.io-client`

dev dependencies:

- `openapi-typescript`

### Backend зависимости для auth-cookie flow

Нужно добавить в `apps/api`:

- `cookie-parser`

dev dependencies:

- `@types/cookie-parser`

### Рекомендуемый codegen-подход

Использовать связку:

- `openapi-typescript` для генерации типов из `apps/web/public/openapi.yml`
- `openapi-fetch` для типобезопасного runtime client

Это даёт:

- генерируемый контракт;
- типизированные request/response;
- тонкий собственный transport-слой;
- отсутствие ручного дублирования схем.

## Целевая структура frontend-кода

Это не жёсткое требование по каждому имени файла, но агент должен прийти примерно к такой структуре:

```text
apps/web/src/
  app/
    providers/
    config/
  router/
    index.ts
    guards.ts
    routes.ts
  layouts/
    PublicLayout.vue
    AppShellLayout.vue
    GroupWorkspaceLayout.vue
  shared/
    api/
      generated/
      client/
    lib/
    ui/
    styles/
  features/
    auth/
    groups/
    lessons/
    assignments/
    submissions/
    schedule/
    chats/
    profile/
  pages/
    public/
    auth/
    groups/
    chats/
    profile/
```

Старые файлы из `apps/web/src/pages`, `apps/web/src/components`, `apps/web/src/data` можно удалять только после того, как новая реализация их полностью заменила.

## Рекомендуемая карта файлов по модулям

Это не жёсткий контракт, но если агенту нужно быстро стартовать без проектного контекста, лучше придерживаться именно такой раскладки.

### App / router / layouts

- `apps/web/src/main.ts`
- `apps/web/src/app/providers/query.ts`
- `apps/web/src/app/providers/pinia.ts`
- `apps/web/src/router/index.ts`
- `apps/web/src/router/routes.ts`
- `apps/web/src/router/guards.ts`
- `apps/web/src/layouts/PublicLayout.vue`
- `apps/web/src/layouts/AppShellLayout.vue`
- `apps/web/src/layouts/GroupWorkspaceLayout.vue`

### Shared API

- `apps/web/src/shared/api/generated/openapi.ts`
- `apps/web/src/shared/api/client/http.ts`
- `apps/web/src/shared/api/client/auth.ts`
- `apps/web/src/shared/api/client/query-client.ts`

### Shared UI and styles

- `apps/web/src/shared/styles/tokens.css`
- `apps/web/src/shared/styles/base.css`
- `apps/web/src/shared/ui/AppButton.vue`
- `apps/web/src/shared/ui/AppInput.vue`
- `apps/web/src/shared/ui/AppTextarea.vue`
- `apps/web/src/shared/ui/AppSelect.vue`
- `apps/web/src/shared/ui/AppCard.vue`
- `apps/web/src/shared/ui/AppEmptyState.vue`
- `apps/web/src/shared/ui/AppErrorState.vue`
- `apps/web/src/shared/ui/AppLoader.vue`

### Auth

- `apps/web/src/features/auth/api/auth.api.ts`
- `apps/web/src/features/auth/stores/auth.store.ts`
- `apps/web/src/features/auth/composables/useAuth.ts`
- `apps/web/src/pages/auth/LoginPage.vue`
- `apps/web/src/pages/auth/RegisterPage.vue`

### Groups

- `apps/web/src/features/groups/api/groups.api.ts`
- `apps/web/src/features/groups/composables/useGroups.ts`
- `apps/web/src/features/groups/components/GroupCatalogCard.vue`
- `apps/web/src/features/groups/components/MyGroupCard.vue`
- `apps/web/src/features/groups/components/GroupsTabs.vue`
- `apps/web/src/pages/groups/GroupsPage.vue`
- `apps/web/src/pages/groups/CreateGroupPage.vue`
- `apps/web/src/pages/groups/JoinByCodePage.vue`
- `apps/web/src/pages/groups/GroupPreviewPage.vue`
- `apps/web/src/pages/groups/GroupOverviewPage.vue`

### Group management

- `apps/web/src/features/group-members/api/group-members.api.ts`
- `apps/web/src/features/group-members/components/MemberListItem.vue`
- `apps/web/src/features/group-settings/api/group-settings.api.ts`
- `apps/web/src/features/group-requests/api/group-requests.api.ts`
- `apps/web/src/pages/groups/GroupParticipantsPage.vue`
- `apps/web/src/pages/groups/GroupRequestsPage.vue`
- `apps/web/src/pages/groups/GroupSettingsPage.vue`

### Lessons

- `apps/web/src/features/lessons/api/lessons.api.ts`
- `apps/web/src/features/lessons/components/LessonListItem.vue`
- `apps/web/src/features/lessons/components/LessonForm.vue`
- `apps/web/src/pages/groups/LessonsPage.vue`
- `apps/web/src/pages/groups/LessonDetailsPage.vue`
- `apps/web/src/pages/groups/LessonEditPage.vue`
- `apps/web/src/pages/groups/LessonCreatePage.vue`

### Assignments and submissions

- `apps/web/src/features/assignments/api/assignments.api.ts`
- `apps/web/src/features/submissions/api/submissions.api.ts`
- `apps/web/src/features/assignments/components/AssignmentListItem.vue`
- `apps/web/src/features/assignments/components/AssignmentForm.vue`
- `apps/web/src/features/submissions/components/SubmissionEditor.vue`
- `apps/web/src/features/submissions/components/SubmissionHistory.vue`
- `apps/web/src/features/submissions/components/AdminSubmissionPanel.vue`
- `apps/web/src/pages/groups/AssignmentsPage.vue`
- `apps/web/src/pages/groups/AssignmentDetailsPage.vue`
- `apps/web/src/pages/groups/AssignmentEditPage.vue`
- `apps/web/src/pages/groups/AssignmentCreatePage.vue`

### Schedule

- `apps/web/src/features/schedule/api/schedule.api.ts`
- `apps/web/src/features/schedule/components/ScheduleDaySection.vue`
- `apps/web/src/features/schedule/components/ScheduleFilters.vue`
- `apps/web/src/features/schedule/components/ScheduleEventForm.vue`
- `apps/web/src/pages/groups/SchedulePage.vue`
- `apps/web/src/pages/groups/ScheduleEventCreatePage.vue`
- `apps/web/src/pages/groups/ScheduleEventEditPage.vue`

### Chats

- `apps/web/src/features/chats/api/chats.api.ts`
- `apps/web/src/features/chats/api/messages.api.ts`
- `apps/web/src/features/chats/realtime/chat-socket.ts`
- `apps/web/src/features/chats/components/ChatListItem.vue`
- `apps/web/src/features/chats/components/MessageList.vue`
- `apps/web/src/features/chats/components/MessageComposer.vue`
- `apps/web/src/features/chats/components/CreateGroupChatModal.vue`
- `apps/web/src/pages/chats/ChatsPage.vue`
- `apps/web/src/pages/groups/GroupChatsPage.vue`

### Profile

- `apps/web/src/features/profile/api/profile.api.ts`
- `apps/web/src/features/profile/components/ProfileForm.vue`
- `apps/web/src/pages/profile/ProfilePage.vue`
- `apps/web/src/pages/profile/UserProfilePage.vue`

## Порядок выполнения

Ниже перечислены шаги реализации. Их нужно выполнять по порядку.

---

## Шаг 0. Подготовить среду и зафиксировать baseline

### Цель

Убедиться, что проект запускается в текущем состоянии, а агент работает не вслепую.

### Вход

- [README.md](/home/smarer/coding/SmarTeach/README.md)
- [package.json](/home/smarer/coding/SmarTeach/package.json)
- [apps/web/package.json](/home/smarer/coding/SmarTeach/apps/web/package.json)
- [apps/api/package.json](/home/smarer/coding/SmarTeach/apps/api/package.json)

### Что сделать

1. Установить зависимости: `npm install`
2. Если инфраструктура ещё не поднята, поднять её по `README`.
3. Выполнить миграции и seed:
   - `npm run db:migrate`
   - `npm run db:seed`
4. Собрать проект:
   - `npm run build`
5. Зафиксировать текущее состояние frontend:
   - `apps/web/src/router.ts`
   - `apps/web/src/pages/*.vue`
   - `apps/web/src/components/*.vue`
   - `apps/web/src/data/mockDashboard.ts`

### Ожидаемый результат

- backend и frontend собираются в baseline-состоянии;
- seed-данные доступны;
- агент знает, что текущий frontend моковый и пойдёт под замену.

### Как проверить

- `npm run build` проходит без ошибок;
- в БД есть seed-пользователи и группы;
- агент может назвать хотя бы один `OPEN`, один `BY_REQUEST` и один `ARCHIVED` seed-сценарий.

---

## Шаг 1. Перевести backend auth на cookie-based refresh flow

### Цель

Сделать backend-контракт совместимым с согласованной auth-моделью frontend:

- `refreshToken` хранится только в `httpOnly cookie`
- frontend не читает refresh token из body
- frontend не отправляет refresh token в body

### Вход

- [auth.controller.ts](/home/smarer/coding/SmarTeach/apps/api/src/modules/auth/auth.controller.ts)
- [auth.service.ts](/home/smarer/coding/SmarTeach/apps/api/src/modules/auth/auth.service.ts)
- [auth-session.dto.ts](/home/smarer/coding/SmarTeach/apps/api/src/modules/auth/dto/auth-session.dto.ts)
- [token-pair.dto.ts](/home/smarer/coding/SmarTeach/apps/api/src/modules/auth/dto/token-pair.dto.ts)
- [refresh-token-request.dto.ts](/home/smarer/coding/SmarTeach/apps/api/src/modules/auth/dto/refresh-token-request.dto.ts)
- [main.ts](/home/smarer/coding/SmarTeach/apps/api/src/main.ts)
- [app-config.service.ts](/home/smarer/coding/SmarTeach/apps/api/src/config/app-config.service.ts)
- [auth-users.e2e.test.ts](/home/smarer/coding/SmarTeach/apps/api/src/tests/auth-users.e2e.test.ts)
- [openapi-contract.test.ts](/home/smarer/coding/SmarTeach/apps/api/src/tests/openapi-contract.test.ts)

### Что сделать

1. Добавить `cookie-parser` в API и подключить middleware в `apps/api/src/main.ts`.
2. В `auth.controller.ts` изменить register/login/refresh/logout так, чтобы:
   - `register` выставлял refresh cookie;
   - `login` выставлял refresh cookie;
   - `refresh` читал refresh token из cookie, а не из body;
   - `refresh` выставлял новый refresh cookie после rotation;
   - `logout` работал по cookie и очищал cookie.
3. В `auth.service.ts` оставить server-side session logic, но убрать зависимость публичного контракта от refresh token в body.
4. Изменить DTO:
   - `AuthSessionDto` больше не должен возвращать `refreshToken`;
   - `TokenPairDto` больше не должен возвращать `refreshToken`;
   - `RefreshTokenRequestDto` должен быть удалён из публичного auth-flow или перестать использоваться controller’ом.
5. Согласовать формат ответов:
   - `register/login`: `user`, `accessToken`, `sessionId`
   - `refresh`: `accessToken`, `sessionId`
   - `logout`: `204 No Content`
6. Задать cookie options:
   - `httpOnly: true`
   - `sameSite: 'lax'`
   - `secure: true` только в production
   - path одинаковый для установки и очистки cookie
7. Проверить CORS-режим:
   - `credentials: true` уже должен оставаться включённым
   - origin должен совпадать с `WEB_URL`
8. Обновить backend-тесты под новый контракт.

### Что не делать

- Не оставлять refresh token одновременно и в body, и в cookie.
- Не строить frontend дальше, пока этот шаг не закрыт.

### Ожидаемый результат

- backend auth соответствует согласованной архитектуре;
- refresh token больше не светится в response body;
- refresh и logout работают без body payload.

### Как проверить

Команды:

- `npm run build:api`
- `npm run test:api`

Проверка вручную:

1. `POST /auth/login` возвращает `accessToken` и ставит cookie.
2. `POST /auth/refresh` без body, но с cookie, возвращает новый `accessToken`.
3. `POST /auth/logout` очищает cookie.
4. `POST /auth/refresh` без cookie даёт `401`.

Проверка кода:

- в `AuthSessionDto` и `TokenPairDto` нет `refreshToken`;
- controller не принимает refresh token из body;
- cookie path/options совпадают на set и clear.

---

## Шаг 2. Обновить OpenAPI и закрепить новый контракт

### Цель

Сделать `apps/web/public/openapi.yml` реальным источником истины после auth-изменений.

### Вход

- [openapi.yml](/home/smarer/coding/SmarTeach/apps/web/public/openapi.yml)
- `apps/api/src/tests/openapi-contract.test.ts`

### Что сделать

1. После закрытия шага 1 пересобрать backend:
   - `npm run build:api`
2. Перегенерировать OpenAPI:
   - `npm run openapi:generate`
3. Проверить, что в `apps/web/public/openapi.yml`:
   - auth endpoints больше не описывают refresh token в body;
   - response schemas для auth обновлены;
   - `refresh` и `logout` соответствуют новому контракту.
4. Если backend-тест на OpenAPI использует ожидаемые схемы, обновить его.

### Ожидаемый результат

- frontend может опираться на актуальный `openapi.yml`;
- auth-контракт больше не противоречит спецификации frontend MVP.

### Как проверить

- `git diff apps/web/public/openapi.yml` показывает изменения auth-контракта;
- `npm run test:api` проходит;
- `openapi.yml` больше не содержит старую request-body схему refresh token для `refresh/logout`.

---

## Шаг 3. Подключить frontend-зависимости и codegen API client

### Цель

Подготовить техническую базу frontend до начала реальной UI-разработки.

### Вход

- [apps/web/package.json](/home/smarer/coding/SmarTeach/apps/web/package.json)
- [openapi.yml](/home/smarer/coding/SmarTeach/apps/web/public/openapi.yml)

### Что сделать

1. Установить web-зависимости:
   - `pinia`
   - `@tanstack/vue-query`
   - `openapi-fetch`
   - `socket.io-client`
2. Установить dev-зависимость:
   - `openapi-typescript`
3. Добавить в `apps/web/package.json` script генерации, например:
   - `openapi:types`
4. Сгенерировать типы из `apps/web/public/openapi.yml` в отдельный файл, например:
   - `apps/web/src/shared/api/generated/openapi.ts`
5. Создать typed HTTP client поверх `openapi-fetch`, например:
   - `apps/web/src/shared/api/client/http.ts`
6. В transport-слое сразу зафиксировать:
   - bearer access token в памяти;
   - `credentials: 'include'` для auth-related запросов;
   - единое место для `401` handling и retry после refresh.

### Ожидаемый результат

- в frontend есть воспроизводимый codegen-пайплайн;
- generated types не пишутся руками;
- HTTP client типобезопасно опирается на OpenAPI.

### Как проверить

- в `apps/web/package.json` есть script генерации OpenAPI-типов;
- generated file существует и не пустой;
- `npm run build:web` проходит;
- transport-layer не содержит hardcoded DTO, которые дублируют generated схемы.

---

## Шаг 4. Пересобрать каркас frontend-приложения

### Цель

Избавиться от текущего мокового каркаса и подготовить основу для настоящего приложения.

### Вход

- [apps/web/src/main.ts](/home/smarer/coding/SmarTeach/apps/web/src/main.ts)
- [apps/web/src/router.ts](/home/smarer/coding/SmarTeach/apps/web/src/router.ts)
- старые `apps/web/src/pages/*.vue`
- старые `apps/web/src/components/*.vue`

### Что сделать

1. Создать новую структуру директорий:
   - `app`
   - `router`
   - `layouts`
   - `shared`
   - `features`
   - новые `pages` по доменам
2. Подключить `Pinia` в `main.ts`.
3. Подключить `Vue Query` provider в `main.ts`.
4. Перенести router из плоского `router.ts` в модульную структуру.
5. Создать базовые layout-компоненты:
   - `PublicLayout`
   - `AppShellLayout`
   - `GroupWorkspaceLayout`
6. Оставить старые мок-экраны временно только если они ещё не заменены, но не развивать их дальше.
7. Подготовить shared-ui foundation:
   - контейнеры
   - card
   - form controls
   - buttons
   - empty/loading/error blocks

### Ожидаемый результат

- у frontend есть нормальный application skeleton;
- route/layout/app concerns разделены;
- новые экраны не зависят от старых мок-компонентов.

### Как проверить

- `apps/web/src/router.ts` больше не является единственным центром маршрутизации;
- `main.ts` использует router, pinia и vue-query;
- есть явные layouts для public/app/group contexts;
- `npm run build:web` проходит.

---

## Шаг 5. Собрать auth-state, guards и public/private routing

### Цель

Сделать работоспособный auth foundation до создания продуктовых экранов.

### Вход

- auth endpoints из `openapi.yml`
- результаты шагов 1-4

### Что сделать

1. Создать auth store/composable, который хранит:
   - `accessToken` в памяти
   - текущего пользователя
   - auth initialization state
2. Реализовать bootstrap flow приложения:
   - при старте попытаться восстановить сессию через `/auth/refresh`
   - после refresh вызвать `/auth/me`
3. Реализовать login flow:
   - запрос логина
   - сохранить `accessToken` в памяти
   - запросить `/auth/me`
4. Реализовать register flow:
   - регистрация
   - авто-вход
   - переход в `Мои группы`
5. Реализовать logout flow:
   - вызвать logout endpoint
   - очистить in-memory session
   - увести на `/login`
6. Реализовать `401` interceptor / retry logic:
   - на первый `401` пробовать refresh
   - после успешного refresh повторять исходный запрос
   - если refresh не удался, делать logout redirect
7. Реализовать router guards:
   - public routes для `/`, `/login`, `/register`
   - private routes для всего остального
   - запрет перехода на login/register для уже авторизованного пользователя

### Ожидаемый результат

- frontend может держать сессию и переживать перезагрузку страницы;
- auth foundation завершён до начала feature-экранов.

### Как проверить

Ручная проверка:

1. Логин seed-пользователем работает.
2. После reload страницы пользователь остаётся в приложении.
3. После logout пользователь уходит на `/login`.
4. Неавторизованный пользователь не попадает в private routes.
5. Авторизованный пользователь не попадает на `/login` и `/register`.

Кодовая проверка:

- `accessToken` не хранится в `localStorage`;
- auth bootstrap выполняется до работы private area;
- retry after refresh централизован, а не размазан по страницам.

---

## Шаг 6. Реализовать публичную зону

### Цель

Закрыть все публичные entry points продукта.

### Вход

- продуктовые решения из [frontend-mvp-spec.md](./frontend-mvp-spec.md)

### Что сделать

1. Создать страницу `/`:
   - сдержанный product landing
   - hero
   - 2-3 блока преимуществ
   - сценарии использования
   - CTA `Войти` и `Зарегистрироваться`
2. Создать отдельную страницу `/login`.
3. Создать отдельную страницу `/register`.
4. Собрать единый visual template для auth-страниц, но без объединения их в один route с табами.
5. Проверить mobile layout для landing/login/register.

### Ожидаемый результат

- публичная часть продукта завершена;
- вход и регистрация отделены друг от друга;
- landing и auth не выглядят как часть старого мокового интерфейса.

### Как проверить

- маршруты `/`, `/login`, `/register` существуют и работают;
- визуальный стиль соответствует product direction, а не старому черновику;
- после успешной регистрации происходит авто-вход.

---

## Шаг 7. Реализовать раздел `Группы`

### Цель

Сделать главный вход в продукт после логина.

### Вход

- endpoints:
  - `/groups`
  - `/groups/{groupId}`
  - `/groups/by-code/{code}`
  - `/groups/{groupId}/join`
  - `/groups/{groupId}/leave`

### Что сделать

1. Создать страницу `/groups` с единым layout и вкладками:
   - `Мои`
   - `Все`
2. Во вкладке `Мои` реализовать:
   - поиск
   - переключение `Активные / Архив`
   - рабочие карточки групп
3. Во вкладке `Все` реализовать:
   - поиск
   - фильтр `accessMode`
   - каталоговые карточки
4. Обработать состояние, когда группа уже моя:
   - карточка остаётся видимой
   - CTA и клик ведут в workspace
5. Реализовать empty state для новых пользователей:
   - `Создать группу`
   - `Найти группу`
   - `Ввести код`
6. Реализовать страницу `/groups/create`:
   - одна форма
   - дефолты `OPEN + chat only`
7. Реализовать страницу `/groups/join`:
   - ввод кода
   - поиск группы по коду
   - переход на preview

### Ожидаемый результат

- после логина пользователь попадает в раздел `Группы`;
- `Мои` и `Все` покрывают основные сценарии;
- создание группы и join by code работают.

### Как проверить

Ручная проверка:

1. Пользователь после логина попадает в `/groups`.
2. `alex.teacher` видит свои группы и архив.
3. `nina.observer` при отсутствии membership видит рабочий empty state.
4. По коду `WEBSPRING26` открывается preview open-группы.
5. По коду `MATHLAB26` открывается preview by-request группы.

Кодовая проверка:

- нет импорта из `mockDashboard.ts`;
- список групп не строится на вручную забитых массивах.

---

## Шаг 8. Реализовать preview группы и контекстный вход в группу

### Цель

Развести сценарии участника и не-участника.

### Вход

- `/groups/{groupId}`
- `/groups/by-code/{code}`
- membership state

### Что сделать

1. Создать `GroupPreviewPage` для не-участника.
2. Показать на preview:
   - название
   - описание
   - владелец
   - число участников
   - access mode
   - включённые модули
   - код группы
   - главное действие
3. Для `OPEN` реализовать join.
4. Для `BY_REQUEST` реализовать create join request и состояние `Заявка отправлена`.
5. Для already-joined группы вести сразу в workspace.
6. Для `CLOSED` outsider’ов не пытаться строить отдельный UI сверх текущего backend-контракта.

### Ожидаемый результат

- карточки групп ведут либо в preview, либо сразу в workspace;
- join flows честно отражают доступность по API.

### Как проверить

- `WEBSPRING26` для outsider’а можно открыть и вступить;
- `MATHLAB26` для outsider’а можно открыть и подать заявку;
- `ARCHIVE26` outsider не видит как доступную public group;
- участник при переходе из каталога попадает не в preview, а в workspace.

---

## Шаг 9. Реализовать group workspace shell

### Цель

Подготовить устойчивый каркас всех внутренних групповых экранов.

### Вход

- group endpoints
- settings endpoints
- решения из продуктовой спеки

### Что сделать

1. Создать `GroupWorkspaceLayout`.
2. Реализовать group loader:
   - загрузка данных группы
   - загрузка settings
   - вычисление membership and role
3. Реализовать route guard:
   - outsider не может попасть в workspace routes
4. Собрать локальный sidebar на desktop.
5. Собрать mobile sheet navigation.
6. Прятать отключённые модули из навигации.
7. Для archived group перевести workspace в read-only режим.
8. Реализовать overview page с:
   - общей информацией
   - кодом группы
   - owner
   - modules
   - ближайшими событиями
   - быстрыми ссылками

### Ожидаемый результат

- все внутренние разделы группы живут в одном общем shell;
- archived/read-only и module-visibility работают централизованно.

### Как проверить

- при открытии group route виден единый layout группы;
- если модуль выключен, он не виден в sidebar;
- archived group не показывает destructive/editing CTAs;
- outsider перенаправляется в preview или получает недоступность, но не внутрь workspace.

---

## Шаг 10. Реализовать участников, заявки и настройки группы

### Цель

Закрыть group-management контур до контентных модулей.

### Вход

- `/groups/{groupId}/members`
- `/groups/{groupId}/members/{userId}`
- `/groups/{groupId}/join-requests`
- `/groups/{groupId}/join-requests/{requestId}`
- `/groups/{groupId}/settings`
- `/groups/{groupId}/leave`

### Что сделать

1. Создать экран `Участники`:
   - список участников
   - бейдж моей роли
   - действия для `OWNER/ADMIN`
2. Реализовать изменение роли участника.
3. Реализовать удаление участника.
4. Реализовать explicit ownership transfer UI.
5. Создать экран `Заявки`:
   - виден только `OWNER/ADMIN`
   - виден только для `BY_REQUEST`
   - список pending/processed заявок
   - approve/reject actions
6. Создать экран `Настройки`:
   - name
   - description
   - access mode
   - status
   - module toggles
7. Для отключения модуля сделать confirm с предупреждением.
8. Реализовать archive/restore.
9. Реализовать delete group только для `OWNER`.
10. Реализовать leave flow:
   - `USER/ADMIN` могут выйти
   - `OWNER` видит путь передачи владения

### Ожидаемый результат

- group-management сценарии завершены до контентных модулей;
- роли и lifecycle группы управляются через UI.

### Как проверить

Ручная проверка:

1. `alex.teacher` может управлять участниками в своей группе.
2. `maria.mentor` видит заявки в `MATHLAB26`.
3. У `OWNER` есть transfer ownership flow.
4. `USER` не видит destructive management actions.
5. Отключение модуля требует подтверждения.

Кодовая проверка:

- `Заявки` не торчат в sidebar, если группа не `BY_REQUEST`;
- archived/read-only состояние не обходится локальным условием на одной странице, а учитывается системно.

---

## Шаг 11. Реализовать модуль уроков

### Цель

Собрать полный lesson-management и lesson-view flow.

### Вход

- `/groups/{groupId}/lessons`
- `/groups/{groupId}/lessons/{lessonId}`

### Что сделать

1. Создать список уроков:
   - ручной порядок
   - фильтр по статусам для `OWNER/ADMIN`
   - только `PUBLISHED` для `USER`
2. Реализовать visual reorder lesson list.
3. Реализовать create lesson page.
4. Реализовать edit lesson page.
5. Реализовать явные действия:
   - `Сохранить черновик`
   - `Опубликовать`
   - `Архивировать`
6. Реализовать form-поля:
   - title
   - content
   - startsAt
   - endsAt
   - files
7. Реализовать lesson detail page:
   - content
   - files
   - linked assignments
8. Для read-only состояний отключить editing actions.

### Ожидаемый результат

- lesson module завершён для админов и участников;
- уроки перестают быть абстрактной страницей и становятся рабочим контентным модулем.

### Как проверить

Ручная проверка:

1. Можно создать lesson без даты.
2. Можно создать lesson только с `startsAt`.
3. Можно опубликовать draft.
4. Можно архивировать опубликованный lesson.
5. `USER` не видит draft и archived lessons.

Кодовая проверка:

- сортировка списка уроков идёт по ручному порядку, а не по дате;
- create/edit используют отдельные full-page forms, а не модалки.

---

## Шаг 12. Реализовать модуль заданий и submissions

### Цель

Собрать основной учебный контур продукта.

### Вход

- `/groups/{groupId}/assignments`
- `/groups/{groupId}/assignments/{assignmentId}`
- `/groups/{groupId}/assignments/{assignmentId}/submissions`
- `/groups/{groupId}/assignments/{assignmentId}/submissions/{submissionId}`

### Что сделать

1. Создать список заданий:
   - с дедлайном первыми по сроку
   - без дедлайна ниже
   - lesson relation как метаданные
2. Реализовать create/edit assignment pages.
3. Поля формы:
   - title
   - content
   - lesson link optional
   - dueAt optional
   - maxScore optional
   - files
4. Реализовать явные действия:
   - `Сохранить черновик`
   - `Опубликовать`
   - `Архивировать`
5. Создать user assignment detail page:
   - описание задания
   - `Моя текущая работа`
   - история попыток
6. Реализовать submission draft flow:
   - создать/обновить draft
   - submit draft
7. Реализовать новый attempt flow после submitted/reviewed.
8. Создать admin assignment detail page:
   - двухпанельный layout
   - слева задание
   - справа grouped submissions by participant
   - акцент на последней попытке
9. Реализовать review flow:
   - feedback
   - score, если `maxScore` задан
10. Реализовать file attachments для assignment и submission.

### Ожидаемый результат

- assignment module покрывает как student flow, так и review flow;
- продукт получает законченную учебную механику.

### Как проверить

Ручная проверка:

1. Можно создать assignment без lesson.
2. Можно создать assignment без due date.
3. Можно создать assignment без max score.
4. Пользователь может сохранить draft submission.
5. Пользователь может отправить submission.
6. После reviewed attempt пользователь может создать новую попытку.
7. Админ видит grouped submissions и проверяет последнюю попытку.

Кодовая проверка:

- для пользователя не смешаны admin-review и self-submission flows;
- история попыток не теряется после создания новой попытки.

---

## Шаг 13. Реализовать модуль расписания

### Цель

Собрать рабочий agenda-view для уроков, дедлайнов и кастомных событий.

### Вход

- `/groups/{groupId}/schedule`
- `/groups/{groupId}/schedule/events`
- `/groups/{groupId}/schedule/events/{eventId}`

### Что сделать

1. Создать экран `Расписание` как ленту по дням.
2. Смешивать в одной ленте:
   - lessons
   - assignment deadlines
   - custom events
3. Добавить быстрые фильтры:
   - `Уроки`
   - `Дедлайны`
   - `События`
4. Реализовать create/edit custom event pages:
   - title
   - description
   - startsAt
   - endsAt
   - location
   - status
5. Для archived/read-only группы скрыть editing CTAs.

### Ожидаемый результат

- расписание работает как полезный operational module, а не как заглушка.

### Как проверить

- экран не является month-calendar;
- события видны по дням;
- фильтры по типам работают;
- custom event CRUD доступен только manager-ролям.

---

## Шаг 14. Реализовать чат-модуль

### Цель

Собрать полноценные direct и group chats с realtime.

### Вход

- `/chats`
- `/chats/{chatId}`
- `/chats/direct`
- `/chats/{chatId}/messages`
- `/groups/{groupId}/chats`
- `/groups/{groupId}/chats/{chatId}`
- websocket namespace `/chat`

### Что сделать

1. Создать глобальный экран `Чаты`:
   - вкладки `Личные / Групповые`
   - desktop split view
   - mobile list -> dialog flow
2. Реализовать левую панель со списком чатов:
   - title
   - message preview
   - last activity
   - avatar/icon
3. Реализовать group chats inside workspace.
4. Если в группе нет room:
   - `OWNER/ADMIN` видят CTA `Создать первый чат`
   - остальные видят empty state
5. Реализовать модалку создания group chat.
6. Реализовать message history:
   - initial recent page
   - `Загрузить предыдущие`
7. Реализовать message composer:
   - text
   - attachments
8. Реализовать edit/delete own message.
9. Реализовать group moderation delete для `OWNER/ADMIN`.
10. Реализовать deleted-message placeholder.
11. Подключить WebSocket:
   - subscribe on active chat
   - patch query cache on create/update/delete
12. Реализовать direct-chat creation из user context:
   - profile
   - participants
   - submission author

### Ожидаемый результат

- chats являются рабочим модулем, а не отдельной демо-страницей;
- realtime работает в пределах текущего backend-контракта.

### Как проверить

Ручная проверка:

1. Direct chats открываются из профиля пользователя.
2. Group chat работает внутри group workspace.
3. Старые сообщения догружаются кнопкой.
4. Удалённое сообщение остаётся плейсхолдером.
5. `OWNER/ADMIN` могут удалить чужое сообщение в group chat.
6. Новое сообщение появляется realtime без reload.

Кодовая проверка:

- нет fake `online`, `typing`, `unread`;
- websocket-логика изолирована внутри chat feature.

---

## Шаг 15. Реализовать профиль и user context actions

### Цель

Закрыть личный профиль и контекст других пользователей.

### Вход

- `/users/me`
- `/users/{userId}`
- `/files`

### Что сделать

1. Создать страницу `/profile`:
   - `displayName`
   - `bio`
   - `avatar`
2. Реализовать edit profile flow.
3. Реализовать avatar upload.
4. Создать публичную страницу `/users/:userId`:
   - avatar
   - name
   - bio
   - CTA `Написать`
5. Использовать public profile как точку входа в direct chat.

### Ожидаемый результат

- личный профиль и публичный профиль завершены без вымышленных полей.

### Как проверить

- в профиле нет полей `phone`, `city`, `role`, `skills`, `interfaceLanguage`;
- direct chat можно открыть из public profile;
- avatar upload работает через `/files`.

---

## Шаг 16. Удалить legacy mock UI и провести финальную полировку

### Цель

Убрать следы старой демо-структуры и завершить rewrite.

### Вход

- весь новый frontend-каркас
- все завершённые feature-модули

### Что сделать

1. Удалить или полностью вывести из использования legacy файлы, если они больше не нужны:
   - `apps/web/src/data/mockDashboard.ts`
   - `apps/web/src/types/dashboard.ts`
   - старые моковые pages
   - старые моковые components
2. Проверить, что старый `router.ts` не используется.
3. Вычистить мёртвые стили и импорты.
4. Проверить mobile navigation:
   - global hamburger
   - group section sheet
   - chats mobile flow
5. Унифицировать:
   - loading states
   - empty states
   - error states
6. Проверить copy на русский язык.
7. Проверить, что в UI не осталось старых терминов и фальшивых полей.

### Ожидаемый результат

- frontend действительно переписан, а не оброс поверх старых моков;
- кодовая база очищена от очевидного legacy.

### Как проверить

Команды:

- `npm run build:web`
- `npm run build`

Поиск по коду:

- `rg -n "mockDashboard|DashboardIntro|CourseCard|CourseGrid|PlaceholderPage" apps/web/src`
- `rg -n "\\bcourse\\b|\\bclass\\b" apps/web/src`

Оба поиска не должны находить пользовательскую логику нового frontend. Допустимы только исторические комментарии или явно помеченный legacy cleanup note, если он временный.

---

## Финальный сценарий ручной проверки

После выполнения всех шагов агент должен прогнать следующий чек-лист:

1. Залогиниться как `alex.teacher@smarteach.local` / `Password123!`
2. Убедиться, что открывается `Мои группы`
3. Открыть `WEBSPRING26` и пройти:
   - overview
   - lessons
   - assignments
   - schedule
   - group chat
   - participants
   - settings
4. Открыть `ARCHIVE26` и убедиться, что workspace read-only
5. Перелогиниться как `nina.observer@smarteach.local`
6. Убедиться, что в `Мои` пустой рабочий экран
7. Через `Все` найти `WEBSPRING26` и вступить
8. Через `Все` найти `MATHLAB26` и отправить заявку
9. Перелогиниться как `maria.mentor@smarteach.local`
10. Открыть `MATHLAB26` и проверить заявки
11. Проверить создание/проверку assignment
12. Проверить direct chat из профиля пользователя
13. Перезагрузить страницу и убедиться, что silent refresh сохраняет сессию
14. Выйти из аккаунта и убедиться, что cookie очищается, а private routes больше недоступны

## Минимальный definition of done

Работу можно считать завершённой только если выполнены все условия:

1. Продукт соответствует [frontend-mvp-spec.md](./frontend-mvp-spec.md)
2. Auth переведён на `httpOnly cookie refresh flow`
3. `openapi.yml` синхронизирован с реальным backend-контрактом
4. Frontend использует `Vue Router + TanStack Query + Pinia + generated OpenAPI types`
5. Основные модули продукта реализованы:
   - landing/auth
   - groups
   - preview/join/create
   - group workspace
   - participants/requests/settings
   - lessons
   - assignments/submissions
   - schedule
   - chats
   - profile
6. Старые мок-данные и устаревшие сущности не управляют новым UI
7. `npm run build` проходит
8. `npm run test:api` проходит
9. Финальный ручной чек-лист из этого документа пройден

## Когда нужно остановиться и не импровизировать

Остановиться и зафиксировать blocker нужно в трёх случаях:

1. `openapi.yml` не синхронизирован с backend после auth-изменений
2. backend-контракт не позволяет реализовать agreed UX без выдуманных полей или фиктивной логики
3. реализация требует разрушения пользовательских изменений в рабочем дереве

Во всех остальных случаях агент должен продолжать реализацию по этому плану, а не останавливать работу на уровне анализа.
