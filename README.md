# SmartTeach

SmartTeach — workspace-монорепо с backend-приложением:

- `apps/api` — backend на `NestJS`

Дополнительные каталоги:

- `packages/shared` — место для общих типов и контрактов
- `infra` — локальная dev-инфраструктура (`PostgreSQL`, `Redis`, `MinIO`)
- `docs` — продуктовая и техническая документация

Prisma-файлы backend теперь лежат в `apps/api/prisma`.

В backend:

- `apps/api/src/modules` — прикладные модули предметной области;
- `apps/api/src/config`, `common`, `database`, `cache`, `storage`, `security` — служебные и инфраструктурные модули.

## Быстрый старт

1. Скопируйте env-файл:

   ```bash
   cp .env.example .env
   ```

   Если API будет доступен не по локальному `localhost`, задайте `API_PUBLIC_URL`.

2. Установите зависимости workspace-репозитория:

   ```bash
   npm install
   ```

3. Поднимите инфраструктуру для backend:

   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

4. Примените Prisma migrations:

   ```bash
   npm run db:migrate
   ```

   Команда также синхронизирует Prisma Client с текущей схемой.

5. Заполните локальную БД тестовыми данными:

   ```bash
   npm run db:seed
   ```

   Seed нужен для предзаполненных backend-сценариев и локальных API-тестов.

6. При необходимости отдельно пересоберите Prisma Client:

   ```bash
   npm run prisma:generate
   ```

7. Запустите API:

   ```bash
   npm run dev
   ```

Отдельные команды:

- `npm run dev:api` — backend
- `npm run build` — сборка backend
- `npm run build:api` — сборка backend
- `npm run db:migrate` — Prisma migration для backend
- `npm run db:seed` — seed для backend

## Локальные сервисы

- REST API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

`minio-init` автоматически создает bucket, имя которого задается через `MINIO_BUCKET`.

## Текущее состояние backend

В `apps/api` уже настроены:

- bootstrap NestJS с `ConfigModule`, `Helmet`, `CORS`, Swagger и versioning `/api/v1`;
- глобальный exception filter, request logging и базовый `Zod` validation pipe;
- инфраструктурные сервисы `PrismaService`, `RedisService`, `MinioService`, `PasswordHashService`, `TokenService`, `CodeGeneratorService`;
- системный endpoint `GET /api/v1/health`.
