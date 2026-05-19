# Документация SmartTeach

Документы в этой папке описывают текущее состояние репозитория и уже реализованного функционала. Здесь нет целевых метрик, продуктовых обещаний и сущностей, которых нет в коде.

## Основные документы

- [01-introduction.md](01-introduction.md) - краткое описание проекта и его текущего охвата
- [02-requirements.md](02-requirements.md) - фактический функциональный охват и технические ограничения
- [03-ui-ux.md](03-ui-ux.md) - карта экранов и пользовательские сценарии
- [04-architecture.md](04-architecture.md) - актуальная архитектура монорепозитория, backend и frontend
- [05-development-plan.md](05-development-plan.md) - текущее состояние реализации вместо устаревшего календарного плана
- [06-conclusions.md](06-conclusions.md) - краткая сводка по текущему состоянию проекта
- [07-database-structure.md](07-database-structure.md) - обзор актуальной схемы данных

## Технические документы

- [openapi.yml](openapi.yml) - актуальный REST-контракт API
- [backend-smoke-test.md](backend-smoke-test.md) - ручной smoke-сценарий для backend
- [backend-implementation-plan.md](backend-implementation-plan.md) - архивная заметка о первоначальном этапе разработки backend

## Источники истины в коде

- API и доступные маршруты backend: `apps/api/src/modules/*/*.controller.ts`
- Полная схема данных: `apps/api/prisma/schema.prisma`
- Маршруты frontend: `apps/web/src/app/router/routes.ts`
- Реальный состав приложений и зависимостей: `package.json`, `apps/api/package.json`, `apps/web/package.json`
