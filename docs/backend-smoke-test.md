# Backend smoke test

Ручной smoke-сценарий для backend MVP:

1. Подготовить окружение:
   - `cp .env.example .env`
   - `npm install`
   - `docker compose -f infra/docker-compose.yml up -d`
2. Подготовить данные:
   - `npm run db:migrate`
   - `npm run db:seed`
3. Запустить backend:
   - `npm run dev:api`
4. Открыть Swagger UI:
   - `http://localhost:3000/api/docs`
5. Пройти базовый auth flow:
   - `POST /auth/register`
   - `POST /auth/login`
   - `POST /auth/refresh`
   - `POST /auth/logout`
6. Проверить группы и доступ:
   - `POST /groups`
   - `GET /groups/{groupId}/settings`
   - `PATCH /groups/{groupId}/settings`
   - `POST /groups/{groupId}/join` или `POST /groups/{groupId}/join-requests`
7. Проверить учебный контур:
   - `POST /groups/{groupId}/lessons`
   - `POST /groups/{groupId}/assignments`
   - `POST /groups/{groupId}/assignments/{assignmentId}/submissions`
   - `GET /groups/{groupId}/schedule`
8. Проверить чат:
   - `POST /chats/direct`
   - `POST /chats/{chatId}/messages`
   - подключение к WebSocket и получение события нового сообщения
