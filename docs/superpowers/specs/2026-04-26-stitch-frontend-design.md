# Stitch Frontend Design

## Source Of Truth

The new frontend in `apps/web` is rebuilt from scratch. The deleted frontend is not a source for structure, styling, routes, components, or data flow.

Primary design input is the Google Stitch project `SmartTeach Educational Platform`, especially these screens:

- `SmarTeach - Главная (Прототип)`
- `SmarTeach - Каталог (Прототип)`
- `SmarTeach - Мои группы (Прототип)`
- `SmarTeach - Предпросмотр группы`
- `SmarTeach - Управление группой (Обзор)`
- `SmarTeach - Чаты (Прототип)`

Missing pages must extend the same visual language instead of introducing a separate product style.

## Visual System

SmarTeach uses an academic editorial interface: large tight headings, generous whitespace, quiet metadata labels, and tonal layering instead of heavy borders.

Core tokens:

- Primary: `#15196c`
- Primary container: `#2d3282`
- Surface: `#fbf8ff`
- Surface low: `#f5f2fa`
- Surface lowest: `#ffffff`
- Surface high: `#eae7ef`
- Surface highest: `#e4e1e9`
- Text: `#1b1b20`
- Muted text: `#464651`
- Outline variant: `#c7c5d3`

Rules:

- Use Inter as the only app font.
- Use a glass top navigation bar with `surface` opacity and backdrop blur.
- Use tonal backgrounds and spacing for separation; avoid visible dividers except low-opacity accessibility fallbacks.
- Use gradient primary CTAs from `primary` to `primary-container`.
- Use compact radii, usually `8px` or less, with `12px` only for soft editorial panels already present in Stitch.
- Use lucide icons for app controls and navigation icons.

## Application Structure

The frontend is a Vue 3 TypeScript workspace package at `apps/web`.

Top-level structure:

- `src/app`: application bootstrap, providers, router, mock/demo catalog
- `src/layouts`: public shell, authenticated shell, group workspace shell
- `src/shared`: API client, types, UI primitives, formatting helpers, styles
- `src/features`: domain components and composables for auth, groups, lessons, assignments, schedule, chats, and profile
- `src/pages`: route-level screens only

Routes cover:

- Public home, login, register
- Group catalog, join by code, group preview, create group
- My groups dashboard
- Group workspace overview, lessons, assignments, submissions, schedule, chats, members, requests, settings
- Global chats
- Current profile and public profile

## Data Flow

The app uses a small typed fetch client against `VITE_API_URL`, defaulting to `/api`.

Auth stores access token and current user in Pinia. Route guards protect workspace pages and redirect unauthenticated users to login. Domain composables fetch backend resources when a session exists and fall back to curated demo data for visual completeness while the backend is not running.

No backend changes are required for the initial design transfer. If later the frontend needs richer dashboard aggregates, unread chat counts, or assignment progress summaries, those should be discussed before changing `apps/api`.

## Testing

Frontend verification includes:

- Unit tests for navigation metadata and demo-data helpers.
- Component tests for core UI primitives and route shells.
- `vue-tsc` typecheck.
- Vite production build.

The implementation should be committed in small checkpoints:

1. Frontend workspace scaffolding and design tokens.
2. Shared layout and UI primitives.
3. Public/catalog/my-groups screens from Stitch.
4. Group workspace and missing feature pages.
5. API/auth integration and final verification.
