# Архивный план реализации backend MVP для SmartTeach

Этот файл больше не описывает текущее состояние проекта и сохранен только как историческая отметка о начальном этапе разработки backend.

## Что использовать вместо него

Для актуальной информации по проекту нужно смотреть:

- [04-architecture.md](04-architecture.md) - текущая архитектура приложений
- [07-database-structure.md](07-database-structure.md) - обзор актуальной модели данных
- [openapi.yml](openapi.yml) - актуальный REST-контракт
- [backend-smoke-test.md](backend-smoke-test.md) - текущий smoke-сценарий

## Источники истины в коде

- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/*/*.controller.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts`

Если потребуется восстановить именно исходный поэтапный план разработки, его нужно смотреть в истории Git, а не использовать как актуальную документацию.
