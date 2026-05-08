# Repository Guidelines

## Project Structure & Module Organization
This repository is an npm workspace monorepo. Backend code lives in `apps/api`, and shared package code lives in `packages/shared/src`. NestJS source lives in `apps/api/src`, organized by feature modules with `controller`, `service`, `mapper`, `dto`, and schema files. Prisma schema, migrations, and seed logic are in `apps/api/prisma`. Product and architecture notes live in `docs`. Generated output in `dist` should not be edited manually.

## Build, Test, and Development Commands
Run commands from the repository root unless a section says otherwise.

- `npm install`: install workspace dependencies.
- `npm run dev`: start the API.
- `npm run dev:api`: run the NestJS API with the root `.env`.
- `npm run build`: build the API workspace.
- `npm run test:api`: build the API and run the Node test suite in `apps/api/src/tests`.
- `npm run openapi:generate`: rebuild the API OpenAPI artifact.
- `npm run db:migrate` / `npm run db:seed`: apply Prisma migrations or seed local data.

## Coding Style & Naming Conventions
Use TypeScript throughout. Follow the existing style: 2-space indentation, single quotes, and no trailing semicolons. In the API, keep NestJS feature folders cohesive and match existing names like `groups.service.ts` and `create-group-request.dto.ts`.

## Testing Guidelines
API tests live in `apps/api/src/tests` and use `.test.ts` or `.e2e.test.ts` suffixes. Prefer adding tests close to the affected backend behavior.

## Commit & Pull Request Guidelines
Recent history uses short imperative subjects, for example `Harden assignment submission invariants`. Keep commits focused and descriptive. Pull requests should include a brief summary, affected routes or endpoints, screenshots for visible UI changes, and notes about schema, OpenAPI, or environment updates when relevant.

## Configuration Notes
Backend scripts expect a root `.env`. If you change Prisma models or API contracts, update migrations and regenerated OpenAPI output together.
